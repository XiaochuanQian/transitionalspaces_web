# 3D Web Project Architecture Diagram

```mermaid
graph TB
    %% Main Application Entry Points
    App["Next.js App"] --> Layout["layout.tsx"]
    Layout --> HomePage["page.tsx (Home)"]
    
    %% Core Components
    HomePage --> WelcomeModal["WelcomeModal"]
    HomePage --> Scene3D["Scene3D (Main 3D Scene)"]
    
    %% Scene3D Dependencies (Production Only)
    Scene3D --> ModelManager["ModelManager"]
    Scene3D --> ViewpointPanel["ViewpointPanel"]
    Scene3D --> ViewpointController["ViewpointController"]
    Scene3D --> CameraController["CameraController"]
    
    %% Model Loading System (Draco Only)
    ModelManager --> ProgressiveDracoLoader["ProgressiveDracoLoader"]
    ProgressiveDracoLoader --> DracoLoader["dracoLoader.ts"]
    
    %% Three.js Integration
    Scene3D --> ThreeJS["Three.js"]
    Scene3D --> R3F["@react-three/fiber"]
    Scene3D --> R3FDrei["@react-three/drei"]
    
    %% Data Flow
    DracoFiles["Draco Compressed Files"] --> ModelManager
    
    %% User Interactions (Production)
    subgraph "User Interactions"
        KeyboardControls["Keyboard Controls (WASD)"]
        ViewpointNavigation["Viewpoint Navigation"]
    end
    
    KeyboardControls --> CameraController
    ViewpointNavigation --> ViewpointController
    
    %% Styling
    classDef mainComponent fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef utilComponent fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef dataComponent fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    
    class Scene3D,ModelManager,ViewpointPanel mainComponent
    class ProgressiveDracoLoader,DracoLoader utilComponent
    class DracoFiles dataComponent
```

## Project Overview (Production Architecture)

This is a **3D Web Application** built with **Next.js** and **Three.js** that provides an interactive 3D environment for visualizing point cloud models. This diagram shows the **production-ready components** only.

### Core Production Features
- **3D Point Cloud Visualization**: Uses Draco compressed geometry format
- **Progressive Loading**: Loads models in multiple quality levels (ultra_low → low → medium → high)
- **Interactive Navigation**: WASD keyboard controls with boundary constraints
- **Viewpoint System**: Predefined camera positions with smooth transitions

### Production Architecture Highlights

1. **Component Hierarchy**: Scene3D acts as the main orchestrator, managing all 3D components and user interactions

2. **Progressive Loading System**: ModelManager coordinates multiple loaders to provide smooth user experience with quality progression

3. **Modular Design**: Each major feature (viewpoints, paths, models) is encapsulated in separate components

4. **Clean Production Build**: Development tools (DevelopmentPanel, ModelControlPanel, Stats) are excluded from production

5. **Configuration-Driven**: Uses JSON files to define models, viewpoints, and paths for easy content management

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **3D Graphics**: Three.js, @react-three/fiber, @react-three/drei
- **Styling**: Tailwind CSS
- **Compression**: Draco geometry compression
- **File Formats**: Draco compressed geometry (.drc)

### Data Flow
1. ModelManager handles progressive loading of 3D assets
2. Scene3D coordinates camera controls, user interactions, and rendering