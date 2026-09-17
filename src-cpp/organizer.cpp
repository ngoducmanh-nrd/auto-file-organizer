#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include <filesystem>
#include <algorithm>
#include <system_error>

namespace fs = std::filesystem;

// Helper to convert lowercase string
std::string to_lower(std::string str) {
    std::transform(str.begin(), str.end(), str.begin(), [](unsigned char c) {
        return std::tolower(c);
    });
    return str;
}

// Check if file is temporary download file
bool is_temp_file(const std::string& ext) {
    static const std::vector<std::string> temp_exts = {
        ".crdownload", ".tmp", ".part", ".download", ".lock"
    };
    for (const auto& temp_ext : temp_exts) {
        if (ext == temp_ext) return true;
    }
    return false;
}

// Safe string split for config line
bool parse_config_line(const std::string& line, std::string& ext, std::string& dest) {
    size_t delimiter_pos = line.find('|'); // Using pipe as delimiter to handle paths with colon (like C:\)
    if (delimiter_pos == std::string::npos) {
        // Fallback to colon if pipe is not found, but we must be careful with C:\
        // A better way is: if we use ':', we search for the first ':' after the drive letter (index > 2)
        delimiter_pos = line.find(':', 3); 
        if (delimiter_pos == std::string::npos) {
            return false;
        }
    }
    ext = line.substr(0, delimiter_pos);
    dest = line.substr(delimiter_pos + 1);
    
    // Trim whitespace
    ext.erase(0, ext.find_first_not_of(" \t\r\n"));
    ext.erase(ext.find_last_not_of(" \t\r\n") + 1);
    dest.erase(0, dest.find_first_not_of(" \t\r\n"));
    dest.erase(dest.find_last_not_of(" \t\r\n") + 1);
    
    return !ext.empty() && !dest.empty();
}

int main(int argc, char* argv[]) {
    if (argc < 3) {
        std::cerr << "Usage: " << argv[0] << " <config_file_path> <results_file_path>" << std::endl;
        return 1;
    }

    std::string config_path = argv[1];
    std::string results_path = argv[2];

    // Read config
    // Config format:
    // Line 1: Source directory path
    // Subsequent lines: extension|destination_directory_path (e.g. .exe|C:\Target\Install)
    
    std::ifstream config_file;
#if defined(_WIN32)
    // On Windows, resolve the config path to path object to support Unicode path arguments
    config_file.open(fs::path(fs::u8path(config_path)));
#else
    config_file.open(config_path);
#endif

    if (!config_file.is_open()) {
        std::cerr << "Error: Could not open config file: " << config_path << std::endl;
        return 1;
    }

    std::string source_dir_str;
    if (!std::getline(config_file, source_dir_str)) {
        std::cerr << "Error: Config file is empty" << std::endl;
        return 1;
    }

    // Trim source directory path
    source_dir_str.erase(0, source_dir_str.find_first_not_of(" \t\r\n"));
    source_dir_str.erase(source_dir_str.find_last_not_of(" \t\r\n") + 1);

    std::map<std::string, std::string> rules;
    std::string line;
    while (std::getline(config_file, line)) {
        std::string ext, dest;
        if (parse_config_line(line, ext, dest)) {
            rules[to_lower(ext)] = dest;
        }
    }
    config_file.close();

    // Verify source directory
    fs::path source_dir = fs::u8path(source_dir_str);
    if (!fs::exists(source_dir) || !fs::is_directory(source_dir)) {
        std::cerr << "Error: Source directory does not exist: " << source_dir_str << std::endl;
        return 1;
    }

    // Open results file
    std::ofstream results_file;
#if defined(_WIN32)
    results_file.open(fs::path(fs::u8path(results_path)));
#else
    results_file.open(results_path);
#endif

    if (!results_file.is_open()) {
        std::cerr << "Error: Could not open results file: " << results_path << std::endl;
        return 1;
    }

    int moved_count = 0;
    int error_count = 0;

    std::error_code ec;
    // Iterate over files in the source directory
    for (const auto& entry : fs::directory_iterator(source_dir, ec)) {
        if (ec) {
            results_file << "ERROR|ALL|Failed to iterate directory: " << ec.message() << "\n";
            break;
        }

        // Only process files (skip directories, symlinks, etc.)
        if (!entry.is_regular_file()) {
            continue;
        }

        fs::path file_path = entry.path();
        std::string file_name_utf8 = file_path.filename().u8string();
        std::string ext_utf8 = to_lower(file_path.extension().u8string());

        // Skip temp download files
        if (is_temp_file(ext_utf8)) {
            continue;
        }

        // Find target directory for extension
        std::string dest_dir_str = "";
        auto it = rules.find(ext_utf8);
        if (it != rules.end()) {
            dest_dir_str = it->second;
        } else {
            // Check for wildcard/others mapping
            auto other_it = rules.find(".*");
            if (other_it != rules.end()) {
                dest_dir_str = other_it->second;
            } else {
                other_it = rules.find("*");
                if (other_it != rules.end()) {
                    dest_dir_str = other_it->second;
                } else {
                    other_it = rules.find("others");
                    if (other_it != rules.end()) {
                        dest_dir_str = other_it->second;
                    }
                }
            }
        }

        // If no mapping found, leave the file as is
        if (dest_dir_str.empty()) {
            continue;
        }

        fs::path dest_dir = fs::u8path(dest_dir_str);

        // Ensure destination directory exists
        std::error_code create_dir_ec;
        if (!fs::exists(dest_dir)) {
            fs::create_directories(dest_dir, create_dir_ec);
            if (create_dir_ec) {
                results_file << "ERROR|" << file_path.u8string() << "|Failed to create directory: " << create_dir_ec.message() << "\n";
                error_count++;
                continue;
            }
        }

        // Handle duplicate names in destination
        fs::path dest_path = dest_dir / file_path.filename();
        if (fs::exists(dest_path)) {
            std::string stem = file_path.stem().u8string();
            int counter = 1;
            while (true) {
                std::string new_filename = stem + " (" + std::to_string(counter) + ")" + ext_utf8;
                fs::path temp_dest_path = dest_dir / fs::u8path(new_filename);
                if (!fs::exists(temp_dest_path)) {
                    dest_path = temp_dest_path;
                    break;
                }
                counter++;
            }
        }

        // Move the file
        std::error_code rename_ec;
        fs::rename(file_path, dest_path, rename_ec);

        // If rename failed (e.g. cross-device link), fallback to copy + delete
        if (rename_ec) {
            std::error_code copy_ec;
            fs::copy(file_path, dest_path, fs::copy_options::none, copy_ec);
            if (!copy_ec) {
                std::error_code remove_ec;
                fs::remove(file_path, remove_ec);
                if (remove_ec) {
                    // Delete failed, we should probably remove the copied file to avoid duplicates,
                    // but it's safer to report it.
                    results_file << "ERROR|" << file_path.u8string() << "|Failed to delete source after copy: " << remove_ec.message() << "\n";
                    error_count++;
                } else {
                    results_file << "OK|" << file_path.u8string() << "|" << dest_path.u8string() << "|" << ext_utf8 << "\n";
                    moved_count++;
                }
            } else {
                results_file << "ERROR|" << file_path.u8string() << "|Failed to move file: " << rename_ec.message() << " (Copy fallback failed: " << copy_ec.message() << ")\n";
                error_count++;
            }
        } else {
            results_file << "OK|" << file_path.u8string() << "|" << dest_path.u8string() << "|" << ext_utf8 << "\n";
            moved_count++;
        }
    }

    results_file << "SUMMARY|" << moved_count << "|" << error_count << "\n";
    results_file.close();

    return 0;
}
