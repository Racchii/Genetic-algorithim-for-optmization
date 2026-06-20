export class City {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  distanceTo(city) {
    const xDistance = Math.abs(this.x - city.x);
    const yDistance = Math.abs(this.y - city.y);
    return Math.sqrt(xDistance * xDistance + yDistance * yDistance);
  }
}

export class Route {
  constructor(cities) {
    this.cities = [...cities];
    this.fitness = 0;
    this.distance = 0;
  }

  calculateDistance() {
    let routeDistance = 0;
    for (let i = 0; i < this.cities.length; i++) {
      let fromCity = this.cities[i];
      let toCity = i + 1 < this.cities.length ? this.cities[i + 1] : this.cities[0];
      routeDistance += fromCity.distanceTo(toCity);
    }
    this.distance = routeDistance;
    return routeDistance;
  }

  calculateFitness() {
    this.fitness = 1 / this.calculateDistance();
    return this.fitness;
  }
}

export class Population {
  constructor(populationSize, initialRoute) {
    this.routes = [];
    this.populationSize = populationSize;
    
    // Initialize random population based on initial route
    for (let i = 0; i < populationSize; i++) {
      let newRouteCities = [...initialRoute];
      // Fisher-Yates shuffle
      for (let j = newRouteCities.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [newRouteCities[j], newRouteCities[k]] = [newRouteCities[k], newRouteCities[j]];
      }
      const newRoute = new Route(newRouteCities);
      newRoute.calculateFitness();
      this.routes.push(newRoute);
    }
  }

  getFittest() {
    let fittest = this.routes[0];
    for (let i = 1; i < this.populationSize; i++) {
      if (fittest.fitness < this.routes[i].fitness) {
        fittest = this.routes[i];
      }
    }
    return fittest;
  }

  evolve(mutationRate, selectionMethod = 'tournament', useElitism = true) {
    const nextGeneration = [];
    
    let offset = 0;
    if (useElitism) {
      // Elitism: keep the best one
      const bestRoute = this.getFittest();
      nextGeneration.push(new Route(bestRoute.cities));
      offset = 1;
    }

    // Crossover to fill the rest of the new generation
    for (let i = offset; i < this.populationSize; i++) {
      let parent1, parent2;
      
      if (selectionMethod === 'roulette') {
        parent1 = this.rouletteSelection();
        parent2 = this.rouletteSelection();
      } else {
        parent1 = this.tournamentSelection();
        parent2 = this.tournamentSelection();
      }
      
      const child = this.crossover(parent1, parent2);
      this.mutate(child, mutationRate);
      child.calculateFitness();
      nextGeneration.push(child);
    }

    this.routes = nextGeneration;
  }

  tournamentSelection() {
    const tournamentSize = 5;
    let best = null;
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.populationSize);
      const candidate = this.routes[randomIndex];
      if (best === null || candidate.fitness > best.fitness) {
        best = candidate;
      }
    }
    return best;
  }

  rouletteSelection() {
    let sumFitness = 0;
    for (let i = 0; i < this.routes.length; i++) {
      sumFitness += this.routes[i].fitness;
    }
    
    let randomVal = Math.random() * sumFitness;
    let partialSum = 0;
    
    for (let i = 0; i < this.routes.length; i++) {
      partialSum += this.routes[i].fitness;
      if (partialSum >= randomVal) {
        return this.routes[i];
      }
    }
    return this.routes[this.routes.length - 1];
  }

  crossover(parent1, parent2) {
    const startPos = Math.floor(Math.random() * parent1.cities.length);
    const endPos = Math.floor(Math.random() * parent1.cities.length);
    
    const childCities = new Array(parent1.cities.length).fill(null);

    // Get subset from parent1
    for (let i = 0; i < parent1.cities.length; i++) {
      if (startPos < endPos && i > startPos && i < endPos) {
        childCities[i] = parent1.cities[i];
      } else if (startPos > endPos) {
        if (!(i < startPos && i > endPos)) {
          childCities[i] = parent1.cities[i];
        }
      }
    }

    // Fill the rest with parent2
    for (let i = 0; i < parent2.cities.length; i++) {
      if (!childCities.includes(parent2.cities[i])) {
        // Find empty spot
        for (let j = 0; j < childCities.length; j++) {
          if (childCities[j] === null) {
            childCities[j] = parent2.cities[i];
            break;
          }
        }
      }
    }

    return new Route(childCities);
  }

  mutate(route, mutationRate) {
    for (let routePos1 = 0; routePos1 < route.cities.length; routePos1++) {
      if (Math.random() < mutationRate) {
        const routePos2 = Math.floor(Math.random() * route.cities.length);
        
        const city1 = route.cities[routePos1];
        const city2 = route.cities[routePos2];

        route.cities[routePos1] = city2;
        route.cities[routePos2] = city1;
      }
    }
  }
}
