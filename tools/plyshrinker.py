import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import numpy as np
import os
import struct
import threading

class PLYShrinker:
    def __init__(self, root):
        self.root = root
        self.root.title("PLY File Shrinker")
        self.root.geometry("800x800")
        
        self.input_files = []
        self.output_directory = ""
        self.ply_data = None
        self.processing = False
        
        self.setup_ui()
    
    def setup_ui(self):
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Title
        title_label = ttk.Label(main_frame, text="PLY Point Cloud Shrinker", 
                               font=("Arial", 16, "bold"))
        title_label.grid(row=0, column=0, columnspan=3, pady=(0, 20))
        
        # Processing mode selection
        mode_frame = ttk.LabelFrame(main_frame, text="Processing Mode", padding="10")
        mode_frame.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 20))
        
        self.mode_var = tk.StringVar(value="single")
        ttk.Radiobutton(mode_frame, text="Single File", variable=self.mode_var, 
                       value="single", command=self.toggle_mode).pack(side=tk.LEFT, padx=10)
        ttk.Radiobutton(mode_frame, text="Batch Processing", variable=self.mode_var, 
                       value="batch", command=self.toggle_mode).pack(side=tk.LEFT, padx=10)
        
        # Single file mode UI
        self.single_frame = ttk.Frame(main_frame)
        self.single_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 20))
        
        # Input file selection
        ttk.Label(self.single_frame, text="Input PLY File:").grid(row=0, column=0, sticky=tk.W, pady=5)
        self.input_label = ttk.Label(self.single_frame, text="No file selected", 
                                    background="white", relief="sunken")
        self.input_label.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(10, 5), pady=5)
        ttk.Button(self.single_frame, text="Browse", 
                  command=self.select_input_file).grid(row=0, column=2, pady=5)
        
        # Output file selection
        ttk.Label(self.single_frame, text="Output PLY File:").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.output_label = ttk.Label(self.single_frame, text="No file selected", 
                                     background="white", relief="sunken")
        self.output_label.grid(row=1, column=1, sticky=(tk.W, tk.E), padx=(10, 5), pady=5)
        ttk.Button(self.single_frame, text="Browse", 
                  command=self.select_output_file).grid(row=1, column=2, pady=5)
        
        # Batch mode UI
        self.batch_frame = ttk.Frame(main_frame)
        self.batch_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 20))
        
        # Input files selection
        ttk.Label(self.batch_frame, text="Input PLY Files:").grid(row=0, column=0, sticky=tk.W, pady=5)
        ttk.Button(self.batch_frame, text="Add Files", 
                  command=self.add_input_files).grid(row=0, column=1, pady=5)
        ttk.Button(self.batch_frame, text="Clear All", 
                  command=self.clear_input_files).grid(row=0, column=2, pady=5)
        
        # File list
        list_frame = ttk.Frame(self.batch_frame)
        list_frame.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=5)
        
        self.file_listbox = tk.Listbox(list_frame, height=6, width=70)
        self.file_listbox.grid(row=0, column=0, sticky=(tk.W, tk.E))
        
        # Bind right-click for context menu
        self.file_listbox.bind("<Button-3>", self.show_context_menu)
        # Bind Delete key to remove selected file
        self.file_listbox.bind("<Delete>", lambda e: self.remove_selected_file())
        # Bind double-click to show file info
        self.file_listbox.bind("<Double-Button-1>", self.show_file_info)
        
        list_scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.file_listbox.yview)
        list_scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        self.file_listbox.configure(yscrollcommand=list_scrollbar.set)
        
        # File count display
        self.file_count_label = ttk.Label(self.batch_frame, text="No files selected")
        self.file_count_label.grid(row=0, column=3, padx=(10, 0), sticky=tk.W)
        
        # Output directory selection
        ttk.Label(self.batch_frame, text="Output Directory:").grid(row=2, column=0, sticky=tk.W, pady=5)
        self.output_dir_label = ttk.Label(self.batch_frame, text="No directory selected", 
                                         background="white", relief="sunken")
        self.output_dir_label.grid(row=2, column=1, sticky=(tk.W, tk.E), padx=(10, 5), pady=5)
        ttk.Button(self.batch_frame, text="Browse", 
                  command=self.select_output_directory).grid(row=2, column=2, pady=5)
        
        # Resolution control
        resolution_frame = ttk.LabelFrame(main_frame, text="Resolution Control", padding="10")
        resolution_frame.grid(row=3, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=20)
        
        ttk.Label(resolution_frame, text="Resolution:").grid(row=0, column=0, sticky=tk.W)
        self.resolution_var = tk.DoubleVar(value=0.5)
        self.resolution_scale = ttk.Scale(resolution_frame, from_=0.1, to=2.0, 
                                         variable=self.resolution_var, 
                                         orient=tk.HORIZONTAL, length=300,
                                         command=self.update_resolution_label)
        self.resolution_scale.grid(row=0, column=1, padx=(10, 0))
        
        self.resolution_label = ttk.Label(resolution_frame, text="0.50 (50% of points)")
        self.resolution_label.grid(row=0, column=2, padx=(10, 0))
        
        # Preset buttons
        preset_frame = ttk.Frame(resolution_frame)
        preset_frame.grid(row=1, column=0, columnspan=3, pady=10)
        
        ttk.Button(preset_frame, text="Low (25%)", 
                  command=lambda: self.set_resolution(0.25)).pack(side=tk.LEFT, padx=5)
        ttk.Button(preset_frame, text="Medium (50%)", 
                  command=lambda: self.set_resolution(0.5)).pack(side=tk.LEFT, padx=5)
        ttk.Button(preset_frame, text="High (100%)", 
                  command=lambda: self.set_resolution(1.0)).pack(side=tk.LEFT, padx=5)
        
        # File info
        info_frame = ttk.LabelFrame(main_frame, text="File Information", padding="10")
        info_frame.grid(row=4, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=20)
        
        self.info_text = tk.Text(info_frame, height=8, width=80)
        self.info_text.grid(row=0, column=0, sticky=(tk.W, tk.E))
        
        # Scrollbar for info text
        scrollbar = ttk.Scrollbar(info_frame, orient=tk.VERTICAL, command=self.info_text.yview)
        scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        self.info_text.configure(yscrollcommand=scrollbar.set)
        
        # Process button
        self.process_button = ttk.Button(main_frame, text="Process PLY File(s)", 
                                        command=self.process_files, state="disabled")
        self.process_button.grid(row=5, column=0, columnspan=3, pady=20)
        
        # Progress frame
        progress_frame = ttk.LabelFrame(main_frame, text="Progress", padding="10")
        progress_frame.grid(row=6, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=10)
        
        self.progress_label = ttk.Label(progress_frame, text="Ready to process")
        self.progress_label.grid(row=0, column=0, columnspan=2, sticky=tk.W, pady=(0, 5))
        
        self.progress_bar = ttk.Progressbar(progress_frame, mode='determinate', length=600)
        self.progress_bar.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=5)
        
        self.progress_percent = ttk.Label(progress_frame, text="0%")
        self.progress_percent.grid(row=1, column=2, padx=(10, 0))
        
        # Configure grid weights
        main_frame.columnconfigure(1, weight=1)
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        
        # Initialize UI state
        self.toggle_mode()
    
    def toggle_mode(self):
        if self.mode_var.get() == "single":
            self.single_frame.grid()
            self.batch_frame.grid_remove()
        else:
            self.single_frame.grid_remove()
            self.batch_frame.grid()
        self.check_ready()
    
    def add_input_files(self):
        files = filedialog.askopenfilenames(
            title="Select Input PLY Files",
            filetypes=[("PLY files", "*.ply"), ("All files", "*.*")]
        )
        for file_path in files:
            if file_path not in self.input_files:
                self.input_files.append(file_path)
                self.file_listbox.insert(tk.END, os.path.basename(file_path))
        
        # Update the file count display
        self.update_file_count()
        self.check_ready()
    
    def clear_input_files(self):
        self.input_files.clear()
        self.file_listbox.delete(0, tk.END)
        self.update_file_count()
        self.check_ready()
    
    def update_file_count(self):
        count = len(self.input_files)
        if count == 0:
            count_text = "No files selected"
        elif count == 1:
            count_text = "1 file selected"
        else:
            count_text = f"{count} files selected"
        
        # Update the label in the batch frame
        if hasattr(self, 'file_count_label'):
            self.file_count_label.config(text=count_text)
    
    def show_context_menu(self, event):
        # Get the clicked item
        selection = self.file_listbox.curselection()
        if not selection:
            return
        
        # Create context menu
        context_menu = tk.Menu(self.root, tearoff=0)
        context_menu.add_command(label="Remove Selected", command=self.remove_selected_file)
        context_menu.add_command(label="Remove All", command=self.clear_input_files)
        context_menu.add_separator()
        context_menu.add_command(label="Add More Files", command=self.add_input_files)
        
        # Show the menu at the cursor position
        context_menu.tk_popup(event.x_root, event.y_root)
    
    def remove_selected_file(self):
        selection = self.file_listbox.curselection()
        if selection:
            index = selection[0]
            # Remove from listbox
            self.file_listbox.delete(index)
            # Remove from input_files list
            if index < len(self.input_files):
                del self.input_files[index]
            self.update_file_count()
            self.check_ready()
    
    def show_file_info(self, event=None):
        selection = self.file_listbox.curselection()
        if not selection:
            return
        
        index = selection[0]
        if index < len(self.input_files):
            file_path = self.input_files[index]
            try:
                info = self.analyze_ply_file(file_path)
                # Create a new window to show file info
                info_window = tk.Toplevel(self.root)
                info_window.title(f"File Info: {os.path.basename(file_path)}")
                info_window.geometry("500x400")
                
                # Add text widget to display info
                text_widget = tk.Text(info_window, wrap=tk.WORD, padx=10, pady=10)
                text_widget.pack(fill=tk.BOTH, expand=True)
                text_widget.insert(tk.END, info)
                text_widget.config(state=tk.DISABLED)
                
                # Add close button
                ttk.Button(info_window, text="Close", command=info_window.destroy).pack(pady=10)
                
            except Exception as e:
                messagebox.showerror("Error", f"Failed to analyze file: {str(e)}")
    
    def select_output_directory(self):
        directory = filedialog.askdirectory(title="Select Output Directory")
        if directory:
            self.output_directory = directory
            self.output_dir_label.config(text=os.path.basename(directory))
            self.check_ready()
    
    def select_input_file(self):
        file_path = filedialog.askopenfilename(
            title="Select Input PLY File",
            filetypes=[("PLY files", "*.ply"), ("All files", "*.*")]
        )
        if file_path:
            self.input_file = file_path
            self.input_label.config(text=os.path.basename(file_path))
            self.load_ply_info()
            self.check_ready()
    
    def select_output_file(self):
        file_path = filedialog.asksaveasfilename(
            title="Save Output PLY File",
            defaultextension=".ply",
            filetypes=[("PLY files", "*.ply"), ("All files", "*.*")]
        )
        if file_path:
            self.output_file = file_path
            self.output_label.config(text=os.path.basename(file_path))
            self.check_ready()
    
    def update_resolution_label(self, value=None):
        resolution = self.resolution_var.get()
        percentage = int(resolution * 100)
        self.resolution_label.config(text=f"{resolution:.2f} ({percentage}% of points)")
        
        # Auto-update file information when resolution changes
        if hasattr(self, 'input_file') and self.input_file:
            self.load_ply_info()
    
    def set_resolution(self, value):
        self.resolution_var.set(value)
        self.update_resolution_label()
    
    def check_ready(self):
        if self.mode_var.get() == "single":
            ready = hasattr(self, 'input_file') and hasattr(self, 'output_file') and self.input_file and self.output_file
        else:
            ready = len(self.input_files) > 0 and self.output_directory
        
        if ready and not self.processing:
            self.process_button.config(state="normal")
        else:
            self.process_button.config(state="disabled")
    
    def load_ply_info(self):
        try:
            if self.mode_var.get() == "single" and hasattr(self, 'input_file') and self.input_file:
                info = self.analyze_ply_file(self.input_file)
                self.info_text.delete(1.0, tk.END)
                self.info_text.insert(tk.END, info)
            elif self.mode_var.get() == "batch" and self.input_files:
                info = self.analyze_batch_files()
                self.info_text.delete(1.0, tk.END)
                self.info_text.insert(tk.END, info)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to analyze PLY file: {str(e)}")
    
    def analyze_batch_files(self):
        total_size = 0
        total_points = 0
        has_colors = False
        has_normals = False
        
        for file_path in self.input_files:
            try:
                with open(file_path, 'rb') as f:
                    line = f.readline().decode('ascii').strip()
                    if line != 'ply':
                        continue
                    
                    vertex_count = 0
                    file_has_color = False
                    file_has_normal = False
                    
                    while True:
                        line = f.readline().decode('ascii').strip()
                        if line.startswith('element vertex'):
                            vertex_count = int(line.split()[-1])
                        elif line.startswith('property') and 'red' in line:
                            file_has_color = True
                        elif line.startswith('property') and 'nx' in line:
                            file_has_normal = True
                        elif line == 'end_header':
                            break
                    
                    total_points += vertex_count
                    total_size += os.path.getsize(file_path)
                    has_colors = has_colors or file_has_color
                    has_normals = has_normals or file_has_normal
            except:
                continue
        
        resolution = self.resolution_var.get()
        
        info_lines = [
            "Batch PLY Files Analysis:",
            "=" * 60,
            "",
            f"Number of Files: {len(self.input_files)}",
            f"Total Size: {total_size / (1024*1024):.2f} MB",
            f"Total Points: {total_points:,}",
            f"Has Colors: {'Yes ✓' if has_colors else 'No ✗'}",
            f"Has Normals: {'Yes ✓' if has_normals else 'No ✗'}",
            "",
            "Resolution Impact:",
            "=" * 60,
            "",
            f"Current Resolution: {resolution:.2f}",
            f"Expected Output Points: {int(total_points * resolution):,}",
            f"Expected File Reduction: {(1 - resolution) * 100:.1f}%",
            f"Expected Output Size: ~{total_size * resolution / (1024*1024):.2f} MB"
        ]
        
        return "\n".join(info_lines)
    
    def analyze_ply_file(self, file_path):
        with open(file_path, 'rb') as f:
            # Read header
            line = f.readline().decode('ascii').strip()
            if line != 'ply':
                raise ValueError("Not a valid PLY file")
            
            vertex_count = 0
            has_color = False
            has_normal = False
            
            while True:
                line = f.readline().decode('ascii').strip()
                if line.startswith('element vertex'):
                    vertex_count = int(line.split()[-1])
                elif line.startswith('property') and 'red' in line:
                    has_color = True
                elif line.startswith('property') and 'nx' in line:
                    has_normal = True
                elif line == 'end_header':
                    break
            
            file_size = os.path.getsize(file_path)
            resolution = self.resolution_var.get()
            
            # Build info string with proper formatting
            info_lines = [
                "Original PLY File Analysis:",
                "=" * 60,
                "",
                f"File: {os.path.basename(file_path)}",
                f"File Size: {file_size / (1024*1024):.2f} MB",
                f"Total Points: {vertex_count:,}",
                f"Has Colors: {'Yes ✓' if has_color else 'No ✗'}",
                f"Has Normals: {'Yes ✓' if has_normal else 'No ✗'}",
                "",
                "Resolution Impact:",
                "=" * 60,
                "",
                f"Current Resolution: {resolution:.2f}",
                f"Expected Output Points: {int(vertex_count * resolution):,}",
                f"Expected File Reduction: {(1 - resolution) * 100:.1f}%",
                f"Expected Output Size: ~{file_size * resolution / (1024*1024):.2f} MB"
            ]
            
            return "\n".join(info_lines)
    
    def process_files(self):
        if self.processing:
            return
        
        self.processing = True
        self.process_button.config(state="disabled")
        
        # Start processing in a separate thread
        thread = threading.Thread(target=self.process_files_thread)
        thread.daemon = True
        thread.start()
    
    def process_files_thread(self):
        try:
            if self.mode_var.get() == "single":
                self.process_single_file()
            else:
                self.process_batch_files()
        except Exception as e:
            self.root.after(0, lambda: messagebox.showerror("Error", f"Failed to process files: {str(e)}"))
        finally:
            self.root.after(0, self.finish_processing)
    
    def process_single_file(self):
        self.root.after(0, lambda: self.progress_label.config(text="Processing single file..."))
        self.root.after(0, lambda: self.progress_bar.config(maximum=100, value=0))
        
        # Process the file
        self.shrink_ply_file(self.input_file, self.output_file)
        
        self.root.after(0, lambda: self.progress_bar.config(value=100))
        self.root.after(0, lambda: self.progress_percent.config(text="100%"))
        
        # Show success message
        output_size = os.path.getsize(self.output_file)
        self.root.after(0, lambda: messagebox.showinfo("Success", 
                              f"PLY file processed successfully!\n"
                              f"Output size: {output_size / (1024*1024):.2f} MB\n"
                              f"Saved to: {os.path.basename(self.output_file)}"))
    
    def process_batch_files(self):
        total_files = len(self.input_files)
        processed_files = 0
        
        self.root.after(0, lambda: self.progress_label.config(text=f"Processing batch files (0/{total_files})..."))
        self.root.after(0, lambda: self.progress_bar.config(maximum=total_files, value=0))
        
        for i, input_file in enumerate(self.input_files):
            try:
                # Create output filename
                base_name = os.path.splitext(os.path.basename(input_file))[0]
                output_file = os.path.join(self.output_directory, f"{base_name}.ply")
                
                # Update progress
                self.root.after(0, lambda f=input_file, p=i+1: self.progress_label.config(
                    text=f"Processing {os.path.basename(f)} ({p}/{total_files})..."))
                self.root.after(0, lambda v=i+1: self.progress_bar.config(value=v))
                self.root.after(0, lambda v=i+1: self.progress_percent.config(text=f"{int((v/total_files)*100)}%"))
                
                # Process the file
                self.shrink_ply_file(input_file, output_file)
                processed_files += 1
                
            except Exception as e:
                self.root.after(0, lambda f=input_file, e=str(e): messagebox.showerror("Error", 
                    f"Failed to process {os.path.basename(f)}: {e}"))
        
        # Show completion message
        self.root.after(0, lambda: messagebox.showinfo("Batch Processing Complete", 
                              f"Processed {processed_files}/{total_files} files successfully!\n"
                              f"Output directory: {self.output_directory}"))
    
    def finish_processing(self):
        self.processing = False
        self.process_button.config(state="normal")
        self.progress_label.config(text="Ready to process")
        self.progress_bar.config(value=0)
        self.progress_percent.config(text="0%")
        self.load_ply_info()
    
    def shrink_ply_file(self, input_path, output_path):
        resolution = self.resolution_var.get()
        
        with open(input_path, 'rb') as input_f:
            # Read and parse header
            header_lines = []
            
            line = input_f.readline().decode('ascii').strip()
            header_lines.append(line)
            
            if line != 'ply':
                raise ValueError("Not a valid PLY file")
            
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
                raise ValueError("Only binary PLY files are supported")
            
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

def main():
    root = tk.Tk()
    app = PLYShrinker(root)
    root.mainloop()

if __name__ == "__main__":
    main()