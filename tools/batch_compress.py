#!/usr/bin/env python3
"""
Batch PLY Compression Script
Processes all PLY files in the models directory and creates compressed versions
at different quality levels (ultra_low, low, medium, high) with gzip compression.
"""

import os
import sys
import gzip
import shutil
from pathlib import Path

# Add the current directory to Python path to import plyshrinker
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the PLYShrinker class (we'll extract the core functionality)
import struct

def shrink_ply_file(input_path, output_path, resolution):
    """
    Shrink a PLY file based on the resolution factor.
    This is extracted from the PLYShrinker class.
    """
    with open(input_path, 'rb') as input_f:
        # Read and parse header
        header_lines = []
        
        line = input_f.readline().decode('ascii').strip()
        header_lines.append(line)
        
        if line != 'ply':
            raise ValueError(f"Not a valid PLY file: {input_path}")
        
        vertex_count = 0
        properties = []
        is_binary = False
        
        while True:
            line = input_f.readline().decode('ascii').strip()
            header_lines.append(line)
            
            if line.startswith('format'):
                if 'binary' in line:
                    is_binary = True
            elif line.startswith('element vertex'):
                vertex_count = int(line.split()[-1])
                # Calculate new vertex count based on resolution
                sample_step = max(1, int(1 / resolution))
                new_vertex_count = vertex_count // sample_step
                # Update the header line with new count
                header_lines[-1] = f"element vertex {new_vertex_count}"
            elif line.startswith('property'):
                properties.append(line)
            elif line == 'end_header':
                break
        
        if not is_binary:
            raise ValueError(f"Only binary PLY files are supported: {input_path}")
        
        # Calculate bytes per vertex based on properties
        bytes_per_vertex = 0
        for prop in properties:
            parts = prop.split()
            if parts[1] == 'float':
                bytes_per_vertex += 4
            elif parts[1] == 'uchar':
                bytes_per_vertex += 1
            elif parts[1] == 'int':
                bytes_per_vertex += 4
            elif parts[1] == 'uint':
                bytes_per_vertex += 4
        
        # Calculate sample step and new vertex count
        sample_step = max(1, int(1 / resolution))
        sampled_count = vertex_count // sample_step
        
        # Write output file
        with open(output_path, 'wb') as output_f:
            # Write header
            for line in header_lines:
                output_f.write((line + '\n').encode('ascii'))
            
            # Read all vertex data into memory
            vertex_data = input_f.read()
            
            # Process vertex data with same logic as JavaScript
            for i in range(sampled_count):
                source_index = i * sample_step
                start_pos = source_index * bytes_per_vertex
                end_pos = start_pos + bytes_per_vertex
                
                if start_pos < len(vertex_data) and end_pos <= len(vertex_data):
                    # Write the sampled vertex data
                    output_f.write(vertex_data[start_pos:end_pos])

def compress_with_gzip(input_path, output_path):
    """
    Compress a file with gzip.
    """
    with open(input_path, 'rb') as f_in:
        with gzip.open(output_path, 'wb') as f_out:
            shutil.copyfileobj(f_in, f_out)

def get_file_size_mb(file_path):
    """
    Get file size in MB.
    """
    return os.path.getsize(file_path) / (1024 * 1024)

def main():
    # Define paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    models_dir = project_root / 'public' / 'models'
    compressed_dir = models_dir / 'compressed'
    
    # Create compressed directory if it doesn't exist
    compressed_dir.mkdir(exist_ok=True)
    
    # Define quality levels and their resolutions
    quality_levels = {
        'ultra_low': 0.1,   # 10% of points
        'low': 0.25,        # 25% of points
        'medium': 0.5,      # 50% of points
        'high': 1.0         # 100% of points (original)
    }
    
    # Find all PLY files in the models directory (excluding compressed folder)
    ply_files = []
    for file_path in models_dir.glob('*.ply'):
        if file_path.is_file():
            ply_files.append(file_path)
    
    if not ply_files:
        print("No PLY files found in the models directory.")
        return
    
    print(f"Found {len(ply_files)} PLY files to process:")
    for ply_file in ply_files:
        size_mb = get_file_size_mb(ply_file)
        print(f"  - {ply_file.name} ({size_mb:.1f} MB)")
    
    print("\nProcessing files...")
    
    total_files = len(ply_files) * len(quality_levels)
    processed_files = 0
    skipped_files = 0
    
    for ply_file in ply_files:
        base_name = ply_file.stem  # filename without extension
        original_size = get_file_size_mb(ply_file)
        
        print(f"\nProcessing {ply_file.name} ({original_size:.1f} MB):")
        
        for quality, resolution in quality_levels.items():
            # Check if compressed file already exists
            final_compressed = compressed_dir / f"{base_name}_{quality}.ply.gz"
            
            if final_compressed.exists():
                compressed_size = get_file_size_mb(final_compressed)
                print(f"  {quality} quality ({int(resolution*100)}%) already exists ({compressed_size:.1f} MB) - SKIPPED")
                skipped_files += 1
                continue
            
            try:
                # Create temporary shrunk file
                temp_shrunk = compressed_dir / f"{base_name}_{quality}_temp.ply"
                
                # Shrink the PLY file
                print(f"  Creating {quality} quality ({int(resolution*100)}%)...", end=" ")
                shrink_ply_file(str(ply_file), str(temp_shrunk), resolution)
                
                # Get shrunk file size
                shrunk_size = get_file_size_mb(temp_shrunk)
                
                # Compress with gzip
                compress_with_gzip(str(temp_shrunk), str(final_compressed))
                
                # Get final compressed size
                compressed_size = get_file_size_mb(final_compressed)
                
                # Remove temporary file
                temp_shrunk.unlink()
                
                # Calculate compression ratio
                compression_ratio = (1 - compressed_size / original_size) * 100
                
                print(f"{shrunk_size:.1f} MB → {compressed_size:.1f} MB ({compression_ratio:.1f}% reduction)")
                
                processed_files += 1
                
            except Exception as e:
                print(f"ERROR: {str(e)}")
                # Clean up temp file if it exists
                if temp_shrunk.exists():
                    temp_shrunk.unlink()
    
    print(f"\nProcessing complete! {processed_files} files processed, {skipped_files} files skipped, {processed_files + skipped_files}/{total_files} total.")
    
    # Show summary of compressed files
    print("\nCompressed files created:")
    compressed_files = list(compressed_dir.glob('*.ply.gz'))
    total_compressed_size = 0
    
    for compressed_file in sorted(compressed_files):
        size_mb = get_file_size_mb(compressed_file)
        total_compressed_size += size_mb
        print(f"  - {compressed_file.name} ({size_mb:.1f} MB)")
    
    # Calculate total original size
    total_original_size = sum(get_file_size_mb(f) for f in ply_files)
    total_reduction = (1 - total_compressed_size / total_original_size) * 100
    
    print(f"\nTotal original size: {total_original_size:.1f} MB")
    print(f"Total compressed size: {total_compressed_size:.1f} MB")
    print(f"Overall reduction: {total_reduction:.1f}%")

if __name__ == '__main__':
    main()