import { useState, useEffect, useRef, useCallback } from 'react'
import { City, Route, Population } from './ga/GA'
import './index.css'

const CITY_RADIUS = 6;
const DRAG_RADIUS = 15;

function App() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Layout & Tabs
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [activeTab, setActiveTab] = useState('controls'); // controls, settings, analytics

  // GA Parameters
  const [numCities, setNumCities] = useState(30);
  const [populationSize, setPopulationSize] = useState(500);
  const [mutationRate, setMutationRate] = useState(0.05);
  const [selectionMethod, setSelectionMethod] = useState('tournament');
  const [useElitism, setUseElitism] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1); // Generations per frame
  
  // State
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [bestDistance, setBestDistance] = useState(Infinity);
  const [history, setHistory] = useState([]); // For analytics chart
  
  // References for GA & interaction
  const populationRef = useRef(null);
  const citiesRef = useRef([]);
  const draggedCityIndexRef = useRef(null);
  const isDraggingRef = useRef(false);
  const mouseDownPosRef = useRef({ x: 0, y: 0 });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const drawBestRoute = useCallback((route) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    if (!route || route.cities.length === 0) return;

    // Draw edges with neon glow
    ctx.beginPath();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    
    for (let i = 0; i < route.cities.length; i++) {
      const city = route.cities[i];
      if (i === 0) {
        ctx.moveTo(city.x, city.y);
      } else {
        ctx.lineTo(city.x, city.y);
      }
    }
    // Connect back to start
    ctx.lineTo(route.cities[0].x, route.cities[0].y);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Draw cities
    for (let i = 0; i < route.cities.length; i++) {
      const city = route.cities[i];
      ctx.beginPath();
      ctx.arc(city.x, city.y, CITY_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#39ff14' : '#ffffff';
      ctx.fill();
      
      ctx.shadowColor = i === 0 ? '#39ff14' : '#ffffff';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [dimensions]);

  const updateGA = useCallback(() => {
    if (citiesRef.current.length < 3) return;
    populationRef.current = new Population(populationSize, citiesRef.current);
    setGeneration(0);
    setHistory([]);
    const best = populationRef.current.getFittest();
    setBestDistance(best.distance);
    drawBestRoute(best);
  }, [populationSize, drawBestRoute]);

  // Presets
  const loadPreset = (type) => {
    setIsRunning(false);
    const newCities = [];
    const padding = 100;
    const cw = dimensions.width;
    const ch = dimensions.height;
    
    if (type === 'random') {
      for (let i = 0; i < numCities; i++) {
        newCities.push(new City(
          Math.random() * (cw - padding * 2) + padding,
          Math.random() * (ch - padding * 2) + padding
        ));
      }
    } else if (type === 'circle') {
      const cx = cw / 2;
      const cy = ch / 2;
      const r = Math.min(cw, ch) / 3;
      for (let i = 0; i < numCities; i++) {
        const angle = (i * 2 * Math.PI) / numCities;
        newCities.push(new City(cx + r * Math.cos(angle), cy + r * Math.sin(angle)));
      }
    } else if (type === 'grid') {
      const cols = Math.ceil(Math.sqrt(numCities));
      const rows = Math.ceil(numCities / cols);
      const spacingX = (cw - padding * 2) / Math.max(1, cols - 1);
      const spacingY = (ch - padding * 2) / Math.max(1, rows - 1);
      
      let count = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (count >= numCities) break;
          newCities.push(new City(padding + c * spacingX, padding + r * spacingY));
          count++;
        }
      }
    }
    
    citiesRef.current = newCities;
    setNumCities(newCities.length);
    updateGA();
  };

  useEffect(() => {
    loadPreset('random');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once

  // Evolution Loop
  useEffect(() => {
    if (!isRunning) return;

    let animationFrameId;

    const loop = () => {
      if (populationRef.current && citiesRef.current.length >= 3) {
        let currentBest = null;
        let gensRun = 0;

        // Run multiple generations per frame based on simSpeed
        for(let i=0; i<simSpeed; i++) {
          populationRef.current.evolve(mutationRate, selectionMethod, useElitism);
          gensRun++;
        }

        currentBest = populationRef.current.getFittest();
        
        setGeneration(g => {
          const newGen = g + gensRun;
          // Update history every 10th generation to avoid massive arrays, or if fast forwarding
          if (newGen % Math.max(1, Math.floor(simSpeed/2)) === 0) {
            setHistory(prev => {
              const newHist = [...prev, { gen: newGen, dist: currentBest.distance }];
              // Keep last 100 points for the chart
              if (newHist.length > 100) return newHist.slice(newHist.length - 100);
              return newHist;
            });
          }
          return newGen;
        });

        setBestDistance(currentBest.distance);
        drawBestRoute(currentBest);
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, mutationRate, selectionMethod, useElitism, simSpeed, drawBestRoute]);

  // --- INTERACTION HANDLERS ---
  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    mouseDownPosRef.current = pos;
    isDraggingRef.current = false;

    for (let i = 0; i < citiesRef.current.length; i++) {
      const city = citiesRef.current[i];
      const dist = Math.sqrt(Math.pow(pos.x - city.x, 2) + Math.pow(pos.y - city.y, 2));
      if (dist <= DRAG_RADIUS) {
        draggedCityIndexRef.current = i;
        isDraggingRef.current = true;
        break;
      }
    }
  };

  const handleMouseMove = (e) => {
    if (isDraggingRef.current && draggedCityIndexRef.current !== null) {
      const pos = getMousePos(e);
      citiesRef.current[draggedCityIndexRef.current].x = pos.x;
      citiesRef.current[draggedCityIndexRef.current].y = pos.y;
      
      if (!isRunning && populationRef.current) {
        const best = populationRef.current.getFittest();
        best.calculateFitness();
        setBestDistance(best.distance);
        drawBestRoute(best);
      }
    }
  };

  const handleMouseUp = (e) => {
    const pos = getMousePos(e);
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      draggedCityIndexRef.current = null;
      if (isRunning) updateGA();
      return;
    }

    const distFromDown = Math.sqrt(Math.pow(pos.x - mouseDownPosRef.current.x, 2) + Math.pow(pos.y - mouseDownPosRef.current.y, 2));
    if (distFromDown < 5) {
      citiesRef.current.push(new City(pos.x, pos.y));
      setNumCities(citiesRef.current.length);
      updateGA();
    }
  };

  // Chart rendering logic
  const renderChart = () => {
    if (history.length < 2) return null;
    const maxDist = Math.max(...history.map(h => h.dist));
    const minDist = Math.min(...history.map(h => h.dist));
    const range = maxDist - minDist || 1;
    
    // Map to SVG coordinates (100% width, 150px height)
    const points = history.map((h, i) => {
      const x = (i / (history.length - 1)) * 100;
      const y = 100 - (((h.dist - minDist) / range) * 90); // 10% padding top
      return `${x}%,${y}%`;
    }).join(' ');

    return (
      <svg width="100%" height="100%" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="#39ff14"
          strokeWidth="2"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div id="root" ref={containerRef}>
      <canvas 
        ref={canvasRef} 
        width={dimensions.width} 
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      <div className="presets-panel">
        <button className="btn-secondary" onClick={() => loadPreset('random')}>Random</button>
        <button className="btn-secondary" onClick={() => loadPreset('circle')}>Circle</button>
        <button className="btn-secondary" onClick={() => loadPreset('grid')}>Grid</button>
      </div>

      <div className="floating-panel">
        <div className="panel-header">
          <h1>GA Visualizer</h1>
          <p>Click to add. Drag to move.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Generation</span>
            <span className="stat-value">{generation}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Distance</span>
            <span className="stat-value highlight">{bestDistance === Infinity ? '-' : Math.round(bestDistance)}</span>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'controls' ? 'active' : ''}`} onClick={() => setActiveTab('controls')}>Controls</button>
          <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
          <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>Analytics</button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'controls' && (
            <>
              <div className="control-group">
                <label>Number of Cities <span className="value">{numCities}</span></label>
                <input 
                  type="range" min="3" max="100" value={numCities}
                  onChange={(e) => {
                    setNumCities(parseInt(e.target.value));
                    setIsRunning(false);
                    loadPreset('random'); // simple way to regenerate
                  }}
                />
              </div>
              <div className="control-group">
                <label>Population Size <span className="value">{populationSize}</span></label>
                <input 
                  type="range" min="50" max="2000" step="50" value={populationSize}
                  onChange={(e) => {
                    setPopulationSize(parseInt(e.target.value));
                    setIsRunning(false);
                    updateGA();
                  }}
                />
              </div>
              <div className="control-group">
                <label>Mutation Rate <span className="value">{(mutationRate * 100).toFixed(1)}%</span></label>
                <input 
                  type="range" min="0.01" max="0.5" step="0.01" value={mutationRate}
                  onChange={(e) => setMutationRate(parseFloat(e.target.value))}
                />
              </div>
            </>
          )}

          {activeTab === 'settings' && (
            <>
              <div className="control-group">
                <label>Selection Method</label>
                <select value={selectionMethod} onChange={(e) => setSelectionMethod(e.target.value)}>
                  <option value="tournament">Tournament Selection</option>
                  <option value="roulette">Roulette Wheel Selection</option>
                </select>
              </div>
              <div className="control-group checkbox">
                <label>Enable Elitism</label>
                <input 
                  type="checkbox" 
                  checked={useElitism}
                  onChange={(e) => setUseElitism(e.target.checked)}
                />
              </div>
              <div className="control-group">
                <label>Speed (Gens per Frame) <span className="value">{simSpeed}</span></label>
                <input 
                  type="range" min="1" max="50" step="1" value={simSpeed}
                  onChange={(e) => setSimSpeed(parseInt(e.target.value))}
                />
              </div>
            </>
          )}

          {activeTab === 'analytics' && (
            <div className="control-group">
              <label>Fitness History (Best Distance)</label>
              <div className="chart-container">
                {renderChart()}
              </div>
            </div>
          )}
        </div>

        <div className="buttons">
          <button 
            className={isRunning ? "btn-danger" : "btn-primary"}
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? "Pause" : "Start"}
          </button>
          <button 
            className="btn-secondary"
            onClick={() => loadPreset('random')}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
