# 🎨 Excalidraw Flow

**Transform your Excalidraw diagrams into stunning animated GIFs with intelligent flow visualization.**

Excalidraw Flow is a powerful web application that brings your static Excalidraw diagrams to life by creating smooth, animated GIFs that visualize the flow and connections between elements in your drawings.

## ✨ Features

### 🚀 **Core Animation Engine**
- **Smart Flow Detection**: Automatically identifies arrows and connections in your Excalidraw diagrams
- **Smooth Animations**: Creates fluid transitions that follow the logical flow of your diagrams
- **High-Quality Output**: Generates crisp, professional animated GIFs

### ⚡ **Advanced Speed Control**
- **Exponential Speed Curve**: Organic speed control from 0.25x to 50x with intelligent curve mapping
- **Speed Presets**: Quick access to Cinematic, Smooth, Normal, Quick, Rapid, and Instant speeds
- **Real-time Preview**: See exactly how fast your animation will be with live duration display

### 🎨 **Visual Customization**
- **Gradient Wave Effects**: Optional gradient color transitions for enhanced visual appeal
- **Customizable Colors**: Choose from and to colors for arrow animations
- **Adjustable Thickness**: Control arrow thickness from 1-10 pixels for perfect visibility
- **Excalidraw Styling**: Maintains the authentic hand-drawn aesthetic throughout

### 📊 **Professional Progress Tracking**
- **LEGO-Style Progress Bars**: Colorful, animated progress indicators with Excalidraw aesthetics
- **Real-time Status**: Live updates on parsing, conversion, rendering, and encoding stages
- **Persistent Visibility**: Always-visible progress bars show baseline state when idle
- **Time Estimation**: Smart time remaining calculations with performance metrics

### 🐛 **Advanced Debugging & Logging**
- **Multi-level Logging**: Debug, info, warn, and error levels with categorized output
- **Live Log Viewer**: Real-time log streaming with filtering, search, and export capabilities
- **Performance Metrics**: Detailed timing information and bottleneck identification
- **Debug Panel**: Collapsible debug interface with logs and progress tabs

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **UI Components**: Radix UI, Tailwind CSS
- **Animation**: Custom SVG animation engine
- **File Processing**: Excalidraw scene parser
- **GIF Generation**: Custom frame renderer and encoder

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/excalidraw-flow.git
   cd excalidraw-flow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## 📖 How to Use

1. **Upload your Excalidraw file** (.excalidraw format)
2. **Configure animation settings**:
   - Choose your preferred speed preset or use custom speed
   - Set colors for arrow animations
   - Adjust arrow thickness
   - Enable gradient wave effects (optional)
3. **Generate your animated GIF**
4. **Monitor progress** through the integrated progress bars
5. **Download your animated GIF** once generation is complete

## 🎯 Perfect For

- **Technical Documentation**: Animate system architecture diagrams
- **Educational Content**: Create engaging flow charts and process diagrams  
- **Presentations**: Add dynamic elements to your slides
- **Social Media**: Share animated explanations of complex concepts
- **Project Planning**: Visualize workflow and process flows

## 🔧 Advanced Features

### Speed Control System
- **Exponential Curve**: Uses power of 3.0 for natural speed progression
- **Smart Mapping**: Intuitive slider that maps to optimal speed ranges
- **Frame Calculation**: Intelligent frame count based on speed and complexity

### Logging & Debugging
- **Event Emitters**: Real-time log streaming with categorized output
- **Export Functionality**: Save logs for analysis and debugging
- **Performance Tracking**: Detailed metrics for optimization

### Progress Tracking
- **Step-based Progress**: Granular progress through each animation stage
- **Time Estimation**: Predictive time remaining with historical data
- **Error Handling**: Graceful error states with detailed reporting

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Excalidraw](https://excalidraw.com/) - the amazing whiteboard tool
- UI components powered by [Radix UI](https://radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Made with ❤️ for the Excalidraw community** 