# Genetic Algorithm for Optimization 🧬

An interactive, immersive web-based visualizer that demonstrates how Genetic Algorithms (GAs) solve the classic **Traveling Salesperson Problem (TSP)**. 

Built with React and Vite, this application uses a cyberpunk/neon aesthetic and features a highly interactive canvas where the algorithm dynamically adapts to user input in real-time.

## ✨ Features

- **Immersive Full-Screen Canvas:** The visualization runs natively across the entire screen with a beautiful neon aesthetic.
- **Deep Interactivity:** 
  - Click anywhere on the canvas to instantly add new cities.
  - Drag and drop existing cities in real-time, watching the optimal route stretch and adapt like a rubber band while the algorithm continues to evolve.
- **Advanced GA Controls:** 
  - Adjust the Number of Cities, Population Size, and Mutation Rate.
  - Switch between **Tournament Selection** and **Roulette Wheel Selection**.
  - Toggle **Elitism** on and off.
  - Control the simulation speed (Generations per frame).
- **Live Analytics:** A real-time SVG line chart tracks the fitness history ("Best Distance") over time.
- **Map Presets:** Instantly spawn complex city layouts like Perfect Circles, strict Grids, or Random scatters.

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Racchii/Genetic-algorithim-for-optmization.git
   cd Genetic-algorithim-for-optmization
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit `http://localhost:5173/` to see the visualizer in action!

## 🧠 How it Works

The Traveling Salesperson Problem asks for the shortest possible route that visits every city exactly once and returns to the origin. The Genetic Algorithm solves this by simulating natural selection:
1. **Population:** A massive pool of random, terrible routes is generated.
2. **Fitness:** Each route is scored based on how short its total distance is.
3. **Selection:** The shortest routes are chosen to become "parents".
4. **Crossover:** The parents combine their "DNA" (the order of cities) to create offspring.
5. **Mutation:** Occasionally, two cities in an offspring's route are swapped to maintain genetic diversity.
6. Over thousands of generations, the routes evolve toward the mathematically optimal path!

## 🛠️ Built With

* **[React](https://reactjs.org/)** - UI Framework
* **[Vite](https://vitejs.dev/)** - Frontend Tooling
* **Vanilla CSS** - For the glassmorphic, neon-cyberpunk styling
