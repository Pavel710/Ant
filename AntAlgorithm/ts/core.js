var Ant = /** @class */ (function () {
    function Ant(graph) {
        this.placesTravelled = [];
        this.tour = [];
        this.graph = graph;
        this.current = this.getRandomVertex();
        if (this.current == null)
            throw "Ant constructor current null ";
    }
    Ant.prototype.getRandomInt = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    Ant.prototype.getRandomVertex = function () {
        var r = this.getRandomInt(1, this.graph.vertices.length - 1);
        return new Edge(this.graph.vertices[r].name, this.graph.vertices[r].x, this.graph.vertices[r].y);
    };
    Ant.prototype.eval = function () {
        var temp = 0;
        for (var i = 1; i < this.tour.length; i++) {
            temp += this.graph.getDistance(this.tour[i], this.tour[i - 1]);
        }
        return temp;
    };
    Ant.prototype.notFinished = function () {
        return this.graph.vertices.length + 1 != this.tour.length;
    };
    Ant.prototype.getTour = function () {
        if (this.notFinished()) {
            throw "Cannot return an incomplete tour.";
        }
        return this.tour;
    };
    Ant.prototype.travel = function () {
        if (!this.notFinished()) {
            throw "Cannot travel since the tour is complete.";
        }
        // If there are no more Edges left, add the first one to the end.
        if (this.graph.edgeToVertexHashMap.length == this.tour.length) {
            this.tour.push(this.tour[0]);
            this.nameAnt = this.tour[0].name;
            return;
        }
        var e = this.nextEdge();
        this.placesTravelled.push({ key: e.getHash(), value: e });
        this.tour.push(e);
        if (e == null)
            throw "travel e null";
        this.current = e;
    };
    Ant.prototype.nextEdge = function () {
        var probabilities = this.probabilities();
        var r = Math.random();
        for (var _i = 0, probabilities_1 = probabilities; _i < probabilities_1.length; _i++) {
            var pair = probabilities_1[_i];
            if (r <= pair.key) {
                return pair.value;
            }
        }
        throw "No Edge could be selected.";
    };
    //P[i,j]
    Ant.prototype.probabilities = function () {
        var denominator = this.denominator();
        var probabilities = [];
        for (var _i = 0, _a = this.graph.getVertex(this.current).edges; _i < _a.length; _i++) {
            var e = _a[_i];
            if (this.placesTravelled.filter(function (x) { return x.key == e.getHash(); }).length > 0)
                continue;
            var pair = { key: 0, value: null };
            if (probabilities.length == 0) {
                pair.key = this.desirability(e) / denominator;
            }
            else {
                var i = probabilities.length - 1;
                pair.key = probabilities[i].key + this.desirability(e) / denominator;
            }
            pair.value = e;
            probabilities.push(pair);
        }
        return probabilities;
    };
    Ant.prototype.validEdges = function () {
        var i = 0;
        for (var _i = 0, _a = this.graph.getVertex(this.current).edges; _i < _a.length; _i++) {
            var e = _a[_i];
            if (this.placesTravelled.filter(function (x) { return x.key == e.getHash(); }).length == 0) {
                i++;
            }
        }
        return i;
    };
    /**
     * Calculate the denominator for the formula that determines the probability
     * of an ant moving from the current location to another.
     * @return      the sum of all the probabilities of each edge
     */
    Ant.prototype.denominator = function () {
        var denominator = 0.0;
        for (var _i = 0, _a = this.graph.getVertex(this.current).edges; _i < _a.length; _i++) {
            var e = _a[_i];
            if (this.placesTravelled.filter(function (x) { return x.key == e.getHash(); }).length > 0)
                continue;
            denominator += this.desirability(e);
        }
        return denominator;
    };
    Ant.prototype.desirability = function (e) {
        var pheromone = Math.pow(e.pheromone, this.graph.alfa);
        var distance = this.graph.getDistance(this.current, e);
        var distanceValue = Math.pow(1 / distance, this.graph.beta);
        return pheromone * distanceValue;
    };
    return Ant;
}());
var Vertex = /** @class */ (function () {
    function Vertex(name, x, y) {
        this.edges = [];
        this.hashMap = [];
        this.name = name;
        this.x = x;
        this.y = y;
    }
    Vertex.prototype.getEdge = function (n) {
        return this.hashMap.filter(function (x) { return x.key == n.getHash(); })[0].value;
    };
    Vertex.prototype.addEdge = function (n) {
        this.hashMap.push({ key: n.getHash(), value: n });
        this.edges.push(n);
    };
    Vertex.prototype.getHash = function () {
        var result = 31 * this.x + this.y;
        return result;
    };
    return Vertex;
}());
var Edge = /** @class */ (function () {
    function Edge(name, x, y) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.pheromone = 0.01;
    }
    Edge.prototype.getHash = function () {
        var result = 31 * this.x + this.y;
        return result;
    };
    return Edge;
}());
var Graph = /** @class */ (function () {
    function Graph(evaporationRate, alfa, beta) {
        this.vertices = [];
        this.edgeToVertexHashMap = [];
        this.alfa = alfa;
        this.beta = beta;
        this.evaporationRate = evaporationRate;
    }
    Graph.prototype.getVertex = function (edge) {
        if (edge == null)
            throw "Edge null";
        return this.edgeToVertexHashMap.filter(function (x) { return x.key == edge.getHash(); })[0].value;
    };
    ;
    Graph.prototype.getDistance = function (edge1, edge2) {
        var xDiff = edge1.x - edge2.x;
        var yDiff = edge1.y - edge2.y;
        return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    };
    Graph.prototype.updatePheromone = function (ant) {
        var eval1 = ant.eval();
        var probability = (1 - this.evaporationRate);
        var edges = ant.getTour();
        var hashSet = [];
        for (var i = 1; i < edges.length; i++) {
            var e1 = this.getVertex(edges[i - 1]).getEdge(edges[i]);
            var e2 = this.getVertex(edges[i]).getEdge(edges[i - 1]);
            // The pheromones.
            var p1 = e1.pheromone;
            var p2 = e2.pheromone;
            hashSet.push(e1);
            hashSet.push(e2);
            e1.pheromone = (probability * p1 + 1.0 / eval1);
            e2.pheromone = (probability * p2 + 1.0 / eval1);
        }
        // Evaporate the pheromones on all the rest of the edges.
        for (var _i = 0, _a = this.vertices; _i < _a.length; _i++) {
            var v = _a[_i];
            for (var _b = 0, _c = v.edges; _b < _c.length; _b++) {
                var e = _c[_b];
                if (!hashSet.indexOf(e)) {
                    var p = e.pheromone;
                    e.pheromone = probability * p;
                }
            }
        }
    };
    Graph.prototype.addVertex = function (vertex) {
        this.edgeToVertexHashMap.push({ key: vertex.getHash(), value: vertex });
        this.vertices.push(vertex);
    };
    Graph.prototype.addEdge = function (vertex, edge) {
        vertex.addEdge(edge);
        this.totalEdges++;
    };
    return Graph;
}());
var GraphGenerator = /** @class */ (function () {
    function GraphGenerator() {
        //test arrays
        this.points = "  1 1150.0 1760.0 \n \
                        2 630.0 1660.0 \n \
                        3 40.0 2090.0 \n \
                        4 750.0 1100.0 \n \
                        5 750.0 2030.0 \n \
                        6 1030.0 2070.0 \n \
                        7 1650.0 650.0 \n \
                        8 1490.0 1630.0 \n \
                        9 790.0 2260.0 \n \
                        10 710.0 1310.0 \n \
                        11 840.0 550.0 \n \
                        12 1170.0 2300.0 \n \
                        13 970.0 1340.0 \n \
                        14 510.0 700.0 \n \
                        15 750.0 900.0 \n \
                        16 1280.0 1200.0 \n \
                        17 230.0 590.0 \n \
                        18 460.0 860.0 \n \
                        19 1040.0 950.0 \n \
                        20 590.0 1390.0 \n \
                        21 830.0 1770.0 \n \
                        22 490.0 500.0 \n \
                        23 1840.0 1240.0 \n \
                        24 1260.0 1500.0 \n \
                        25 1280.0 790.0 \n \
                        26 490.0 2130.0 \n \
                        27 1460.0 1420.0 \n \
                        28 1260.0 1910.0 \n \
                        29 360.0 1980.0";
        this.points1 = "  1 1150.0 1760.0 \n \
                        2 630.0 1660.0 \n \
                        3 40.0 2090.0 \n \
                        4 750.0 1100.0 \n \
                        5 750.0 2030.0";
        //primyri array
        this.points2 = "  1 1500.0 1100.0 \n \
                        2 1500.0 1200.0 \n \
                        3 1500.0 1300.0 \n \
                        4 1500.0 1400.0 \n \
                        5 1550.0 1050.0 \n \
                        6 1550.0 1150.0 \n \
                        7 1550.0 1250.0 \n \
                        8 1550.0 1350.0 \n \
                        9 1550.0 1450.0 \n \
                        10 1600.0 1100.0 \n \
                        11 1600.0 1200.0 \n \
                        12 1600.0 1300.0 \n \
                        13 1600.0 1400.0 \n \
                        14 1650.0 1050.0 \n \
                        15 1650.0 1150.0 \n \
                        16 1650.0 1250.0 \n \
                        17 1650.0 1350.0 \n \
                        18 1650.0 1450.0 \n \
                        19 1700.0 1100.0 \n \
                        20 1700.0 1200.0 \n \
                        21 1700.0 1300.0 \n \
                        22 1700.0 1400.0 \n \
                        23 1750.0 1050.0 \n \
                        24 1750.0 1150.0 \n \
                        25 1750.0 1250.0 \n \
                        26 1750.0 1350.0 \n \
                        27 1750.0 1450.0 \n \
                        28 1800.0 1100.0 \n \
                        29 1800.0 1200.0 \n \
                        30 1800.0 1300.0 \n \
                        31 1800.0 1400.0 \n \
                        32 1850.0 1050.0 \n \
                        33 1850.0 1150.0 \n \
                        34 1850.0 1250.0 \n \
                        35 1850.0 1350.0 \n \
                        36 1850.0 1450.0 \n \
                        37 1900.0 1100.0 \n \
                        38 1900.0 1200.0 \n \
                        39 1900.0 1300.0 \n \
                        40 1900.0 1400.0 ";
        this.vertices = [];
    }
    GraphGenerator.prototype.removeWhiteSpace = function (s) {
        for (var i = 1; i < s.length; i++) {
            if (s.charAt(i) == ' ' && s.charAt(i - 1) == ' ') {
                if (i != s.length) {
                    s = s.substring(0, i) + s.substring(i + 1, s.length);
                    i--;
                }
                else {
                    s = s.substring(0, i);
                    i--;
                }
            }
        }
        return s;
    };
    GraphGenerator.prototype.create = function (evaporation, alpha, beta) {
        var lines = this.points2.split(/\r?\n/);
        this.numOfCities = lines.length;
        for (var i = 0; i < lines.length; i++) {
            var line = this.removeWhiteSpace(lines[i]).trim().split(" ");
            this.vertices.push(new Vertex(line[0], parseInt(line[2]), parseInt(line[1])));
        }
        var graph = new Graph(evaporation, alpha, beta);
        //Create the spine of the graph (the vertices).
        for (var i = 0; i < this.numOfCities; i++) {
            graph.addVertex(this.vertices[i]);
        }
        // Create the edges of the graph (connect every vertex to each other).
        for (var _i = 0, _a = graph.vertices; _i < _a.length; _i++) {
            var v = _a[_i];
            for (var i = 0; i < this.numOfCities; i++) {
                if (this.vertices[i] != v) {
                    graph.addEdge(v, new Edge(this.vertices[i].name, this.vertices[i].x, this.vertices[i].y));
                }
            }
        }
        return graph;
    };
    return GraphGenerator;
}());
var TravelingSalesman = /** @class */ (function () {
    /**
     * Construct TravelingSalesman.
     * @param ants          the number of ants to run per generation
     * @param generations   the number of generations to run
     * @param evaporation   the rate of evaporation
     * @param alpha         the impact of pheromones on decision making
     * @param beta          the impact of distance in decision making
     */
    function TravelingSalesman(ants, generations, evaporation, alpha, beta) {
        this.numOfAnts = ants;
        this.generations = generations;
        this.graph = new GraphGenerator().create(evaporation, alpha, beta);
        this.displ = new Display(this.graph);
        this.displ1 = new DisplayArrows(this.graph);
    }
    /**
     * Run the algorithm.
     */
    TravelingSalesman.prototype.run = function () {
        var bestAnt = null;
        var bestEval = 0;
        for (var i = 0; i < this.generations; i++) {
            var ants = this.createAnts(this.numOfAnts);
            var ant = this.travel(ants);
            this.updatePheromones(ants);
            if (bestAnt == null) {
                bestAnt = ant;
                bestEval = ant.eval();
            }
            else if (ant.eval() < bestEval) {
                bestAnt = ant;
                bestEval = ant.eval();
            }
        }
        //console data for more detail (F12 in browser)
        console.log("Best Tour: ");
        console.log(bestAnt);
        console.log("Evaluation: " + bestEval);
        var ul = document.getElementById("list");
        var li = document.createElement("li");
        li.appendChild(document.createTextNode("Лучший путь: " + "| Начальный город: " + bestAnt.nameAnt + " | Длинна пути: " + bestEval));
        ul.appendChild(li);
        this.displ.drawTour(bestAnt.getTour());
        this.displ1.drawTour(bestAnt.getTour());
    };
    /**
     * Create ants and put them on random starting positions on the graph.
     * @param quantity  the quantity of ants to create
     * @return          an array of the ants created
     */
    TravelingSalesman.prototype.createAnts = function (quantity) {
        var ants = [];
        for (var i = 0; i < quantity; i++) {
            ants[i] = new Ant(this.graph);
        }
        return ants;
    };
    /**
     * Let each ant in the input array travel until an entire tour is completed.
     * @param ants      the ants to allow to travel
     * @return          the ant with the best evaluation
     */
    TravelingSalesman.prototype.travel = function (ants) {
        var bestAnt = null;
        var bestEval = 0;
        for (var _i = 0, ants_1 = ants; _i < ants_1.length; _i++) {
            var ant = ants_1[_i];
            while (ant.notFinished()) {
                ant.travel();
            }
            if (bestAnt == null) {
                bestAnt = ant;
                bestEval = ant.eval();
            }
            else if (ant.eval() < bestEval) {
                bestAnt = ant;
                bestEval = ant.eval();
            }
        }
        return bestAnt;
    };
    /**
     * Update the pheromones in the graph based on an array of ants with
     * completed tours.
     * @param ants  the ants that will be used to update the pheromones
     */
    TravelingSalesman.prototype.updatePheromones = function (ants) {
        for (var _i = 0, ants_2 = ants; _i < ants_2.length; _i++) {
            var ant = ants_2[_i];
            this.graph.updatePheromone(ant);
        }
    };
    /**
     * Sleep the thread for a specified amount of time.
     * @param ms    milliseconds to sleep for
     */
    TravelingSalesman.prototype.delay = function (ms) {
        var cur_d = new Date();
        var cur_ticks = cur_d.getTime();
        var ms_passed = 0;
        while (ms_passed < ms) {
            var d = new Date(); // Possible memory leak?
            var ticks = d.getTime();
            ms_passed = ticks - cur_ticks;
            // d = null;  // Prevent memory leak?
        }
    };
    return TravelingSalesman;
}());
var Display = /** @class */ (function () {
    function Display(graph) {
        this.arrVertex = [];
        this.arrEdges = [];
        this.graph = graph;
        for (var i = 0; i < this.graph.vertices.length; i++) {
            this.arrVertex.push({ id: i, label: this.graph.vertices[i].name, x: this.graph.vertices[i].x, y: this.graph.vertices[i].y });
        }
        this.nodes = new vis.DataSet(this.arrVertex);
        this.edges = new vis.DataSet([]);
        var container = document.getElementById('mynetwork');
        var data = {
            nodes: this.nodes,
            edges: this.edges
        };
        var options = {
            interaction: { dragNodes: false },
            manipulation: { enabled: false },
            physics: { enabled: false }
        };
        this.network = new vis.Network(container, data, options);
    }
    Display.prototype.drawTour = function (tour) {
        this.edges.clear();
        for (var i = 1; i < tour.length; i++) {
            var idFrom = this.arrVertex.filter(function (x) { return x.label == tour[i - 1].name; })[0].id;
            var idTo = this.arrVertex.filter(function (x) { return x.label == tour[i].name; })[0].id;
            var labelEdge = (idFrom + 1) + ' - ' + (idTo + 1);
            this.edges.update({
                id: labelEdge,
                from: idFrom,
                to: idTo,
                label: labelEdge
            });
        }
    };
    return Display;
}());
var DisplayArrows = /** @class */ (function () {
    function DisplayArrows(graph) {
        this.arrVertex = [];
        this.arrEdges = [];
        this.graph = graph;
        for (var i = 0; i < this.graph.vertices.length; i++) {
            this.arrVertex.push({ id: i, label: this.graph.vertices[i].name, x: this.graph.vertices[i].x, y: this.graph.vertices[i].y });
        }
        this.nodes = new vis.DataSet(this.arrVertex);
        this.edges = new vis.DataSet([]);
        var container = document.getElementById('mynetwork1');
        var data = {
            nodes: this.nodes,
            edges: this.edges
        };
        var options = {
            interaction: { dragNodes: false },
            manipulation: { enabled: false },
            physics: { enabled: false }
        };
        this.network = new vis.Network(container, data, options);
    }
    DisplayArrows.prototype.timeout = function (idFrom, idTo, i) {
        var _this = this;
        setTimeout(function () {
            _this.edges.update({
                from: idFrom,
                to: idTo,
                arrows: 'to'
            });
            _this.timeout(idFrom, idTo, i);
        }, 2000);
    };
    DisplayArrows.prototype.drawTour = function (tour) {
        var _this = this;
        var clickedNode = this.nodes.get(tour[0].name);
        var nodeStart = this.nodes.get(clickedNode.id - 1);
        nodeStart.color = {
            border: '#ff0000',
            background: '#ff0000',
        };
        nodeStart.font = {
            color: '#FFFFFF'
        };
        this.nodes.update(nodeStart);
        this.edges.clear();
        for (var i = 1; i < tour.length; i++) {
            var idFrom = this.arrVertex.filter(function (x) { return x.label == tour[i - 1].name; })[0].id;
            var idTo = this.arrVertex.filter(function (x) { return x.label == tour[i].name; })[0].id;
            var n;
            //this.edges.update({
            //    from: idFrom,
            //    to: idTo,
            //    arrows: 'to'
            //});
            //setInterval(() => {
            //    this.edges.update({
            //        from: idFrom,
            //        to: idTo,
            //        arrows: 'to'
            //    });
            //}, 1000);
            n = setTimeout(function () {
                _this.edges.update({
                    from: idFrom,
                    to: idTo,
                    arrows: 'to'
                });
            }, 1000, this);
            //this.timeout(idFrom, idTo,  i);
        }
    };
    return DisplayArrows;
}());
//# sourceMappingURL=core.js.map