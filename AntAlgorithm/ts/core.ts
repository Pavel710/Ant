declare var $: any;
declare var vis: any;

class Ant {

    private graph: Graph;
    private current: Edge;
    private placesTravelled: { key: number, value: Edge }[] = [];
    private tour: Edge[] = [];
    public nameAnt: string;

    constructor(graph: Graph) {
        this.graph = graph;
        this.current = this.getRandomVertex();
        if(this.current == null)
            throw "Ant constructor current null "
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getRandomVertex(): Edge {
        let r: number = this.getRandomInt(1, this.graph.vertices.length - 1);

        return new Edge(this.graph.vertices[r].name, this.graph.vertices[r].x, this.graph.vertices[r].y);
    }

    eval(): number {
        let temp: number = 0;

        for (var i = 1; i < this.tour.length; i++) {
            temp += this.graph.getDistance(this.tour[i], this.tour[i - 1]);
        }

        return temp;
    }

    notFinished(): boolean {
        return this.graph.vertices.length + 1 != this.tour.length;
    }

    getTour(): Edge[] {
        if (this.notFinished()) {
            throw "Cannot return an incomplete tour.";
        }

        return this.tour;
    }

    travel() {

        if (!this.notFinished()) {
            throw "Cannot travel since the tour is complete.";
        }

        // If there are no more Edges left, add the first one to the end.
        if (this.graph.edgeToVertexHashMap.length == this.tour.length) {
            this.tour.push(this.tour[0]);
            this.nameAnt = this.tour[0].name;
            return;
        }

        let e: Edge = this.nextEdge();
        this.placesTravelled.push({ key: e.getHash(), value: e });
        this.tour.push(e);
        if (e == null)
            throw "travel e null";
        this.current = e;
    }

    nextEdge(): Edge {
        let probabilities: { key: number, value: Edge }[] = this.probabilities();
        let r: number = Math.random();

        for (var pair of probabilities) {
            if (r <= pair.key) {
                return pair.value;
            }
        }

        throw "No Edge could be selected.";
    }

    //P[i,j]
    probabilities(): { key: number, value: Edge }[] {
        let denominator: number = this.denominator();
        let probabilities: { key: number, value: Edge }[] = [];
        
        for (var e of this.graph.getVertex(this.current).edges) {
            if (this.placesTravelled.filter(x => x.key == e.getHash()).length > 0) continue;
            let pair: { key: number, value: Edge } = { key: 0, value: null };

            if (probabilities.length == 0) {
                pair.key = this.desirability(e) / denominator;
            } else {
                let i: number = probabilities.length - 1;
                pair.key = probabilities[i].key + this.desirability(e) / denominator;
            }

            pair.value = e;
            probabilities.push(pair);
        }

        return probabilities;
    }

    validEdges(): number {
        let i: number = 0;
        for (var e of this.graph.getVertex(this.current).edges) {
            if (this.placesTravelled.filter(x => x.key == e.getHash()).length == 0) {
                i++;
            }
        }
        return i;
    }

    /**
     * Calculate the denominator for the formula that determines the probability
     * of an ant moving from the current location to another.
     * @return      the sum of all the probabilities of each edge
     */
    denominator(): number {
        let denominator: number = 0.0;
        for (var e of this.graph.getVertex(this.current).edges) {
            if (this.placesTravelled.filter(x => x.key == e.getHash()).length > 0) continue;
            denominator += this.desirability(e);
        }
        return denominator;
    }

    desirability(e: Edge): number {
        let pheromone = Math.pow(e.pheromone, this.graph.alfa);
        let distance = this.graph.getDistance(this.current, e);
        let distanceValue = Math.pow(1 / distance, this.graph.beta);
        return pheromone * distanceValue;
    }

}


class Vertex { 

    x: number;
    y: number;
    name: string;
    edges: Edge[] = [];

    constructor(name: string, x: number, y: number) {
        this.name = name;
        this.x = x;
        this.y = y;
    }

    hashMap: { key: number, value: Edge }[] = [];
    
    getEdge(n: Edge): Edge {
        return this.hashMap.filter(x => x.key == n.getHash())[0].value;
    }

    addEdge(n: Edge) {
        this.hashMap.push({key: n.getHash(), value: n });
        this.edges.push(n);
    }

    getHash(): number {
        let result: number = 31 * this.x + this.y;
        return result;
    }
}

class Edge {
    x: number;
    y: number;
    name: string;
    pheromone: number;

    constructor(name: string, x: number, y: number) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.pheromone = 0.01
    }

    getHash(): number {
        let result: number = 31 * this.x + this.y;
        return result;
    }
}

class Graph {
    vertices: Vertex[] = [];
    edgeToVertexHashMap: { key: number, value: Vertex }[] = [];
    totalEdges: number;

    evaporationRate: number;
    alfa: number;
    beta: number;


    constructor(evaporationRate: number, alfa: number, beta: number) {
        this.alfa = alfa;
        this.beta = beta;
        this.evaporationRate = evaporationRate;
    }

    getVertex(edge: Edge): Vertex {
        if (edge == null)
            throw "Edge null"
        return this.edgeToVertexHashMap.filter(x => x.key == edge.getHash())[0].value;
    };

    getDistance(edge1: Edge, edge2: Edge): number {
        let xDiff: number = edge1.x - edge2.x;
        let yDiff: number = edge1.y - edge2.y;

        return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    }

    updatePheromone(ant: Ant) {

        let eval1: number = ant.eval();

        let probability: number = (1 - this.evaporationRate);

        let edges: Edge[] = ant.getTour();

        let hashSet: Edge[] = [];

        for (var i = 1; i < edges.length; i++) {
            let e1: Edge = this.getVertex(edges[i - 1]).getEdge(edges[i]);
            let e2: Edge = this.getVertex(edges[i]).getEdge(edges[i - 1]);

            // The pheromones.
            let p1: number = e1.pheromone;
            let p2: number = e2.pheromone;

            hashSet.push(e1);
            hashSet.push(e2);

            e1.pheromone = (probability * p1 + 1.0 / eval1);
            e2.pheromone = (probability * p2 + 1.0 / eval1);
        }

        // Evaporate the pheromones on all the rest of the edges.
        for (var v of this.vertices) {
            for (var e of v.edges) {
                if (!hashSet.indexOf(e)) {
                    var p: number = e.pheromone;
                    e.pheromone = probability * p;
                }
            }
        }
        
    }

    addVertex(vertex: Vertex) {
        this.edgeToVertexHashMap.push({ key: vertex.getHash(), value: vertex });
        this.vertices.push(vertex);
    }

    addEdge(vertex: Vertex, edge: Edge) {
        vertex.addEdge(edge);
        this.totalEdges++;
    }
}

class GraphGenerator {

    //test arrays
    points: string = "  1 1150.0 1760.0 \n \
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

    points1: string = "  1 1150.0 1760.0 \n \
                        2 630.0 1660.0 \n \
                        3 40.0 2090.0 \n \
                        4 750.0 1100.0 \n \
                        5 750.0 2030.0";

    //primyri array
    points2: string = "  1 1500.0 1100.0 \n \
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

    removeWhiteSpace(s: string): string {
        for (var i = 1; i < s.length; i++) {
            if (s.charAt(i) == ' ' && s.charAt(i - 1) == ' ') {
                if (i != s.length) {
                    s = s.substring(0, i) + s.substring(i + 1, s.length);
                    i--;
                } else {
                    s = s.substring(0, i);
                    i--;
                }
            }
        }
        return s;
    }

    vertices: Vertex[] = [];
    numOfCities: number;

    create(evaporation: number, alpha: number, beta: number): Graph {
        let lines = this.points2.split(/\r?\n/);
        this.numOfCities = lines.length;
        for (var i = 0; i < lines.length; i++) {
            let line: string[] = this.removeWhiteSpace(lines[i]).trim().split(" ");
            this.vertices.push(new Vertex(line[0], parseInt(line[2]), parseInt(line[1])));
        }

        let graph: Graph = new Graph(evaporation, alpha, beta);

        //Create the spine of the graph (the vertices).
        for (var i = 0; i < this.numOfCities; i++) {
            graph.addVertex(this.vertices[i]);
        }
        
        // Create the edges of the graph (connect every vertex to each other).
        for (var v of graph.vertices) {
            for (var i = 0; i < this.numOfCities; i++) {
                if (this.vertices[i] != v) {
                    graph.addEdge(v, new Edge(this.vertices[i].name, this.vertices[i].x, this.vertices[i].y));
                }
            }
        }
        
        return graph;
    }
}

class TravelingSalesman {

    private graph: Graph;
    private numOfAnts: number;
    private generations: number;
    private displ: Display;
    private displ1: DisplayArrows;
    
    /**
     * Construct TravelingSalesman.
     * @param ants          the number of ants to run per generation
     * @param generations   the number of generations to run
     * @param evaporation   the rate of evaporation
     * @param alpha         the impact of pheromones on decision making
     * @param beta          the impact of distance in decision making
     */

    constructor(ants: number, generations: number, evaporation: number, alpha: number, beta: number) {
        this.numOfAnts = ants;
        this.generations = generations;
        this.graph = new GraphGenerator().create(evaporation, alpha, beta);
        this.displ = new Display(this.graph);
        this.displ1 = new DisplayArrows(this.graph);
    }

    /**
     * Run the algorithm.
     */
    run() {
        

        let bestAnt: Ant = null;
        let bestEval: number = 0;

        for (var i = 0; i < this.generations; i++) {
            let ants: Ant[] = this.createAnts(this.numOfAnts);
            let ant: Ant = this.travel(ants);
            this.updatePheromones(ants);

            if (bestAnt == null) {
                bestAnt = ant;
                bestEval = ant.eval();
            } else if (ant.eval() < bestEval) {
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
    }

    /**
     * Create ants and put them on random starting positions on the graph.
     * @param quantity  the quantity of ants to create
     * @return          an array of the ants created
     */
    createAnts(quantity: number): Ant[] {
        let ants: Ant[] = [];
        for (var i = 0; i < quantity; i++) {
            ants[i] = new Ant(this.graph);
        }
        return ants;
    }

    /**
     * Let each ant in the input array travel until an entire tour is completed.
     * @param ants      the ants to allow to travel
     * @return          the ant with the best evaluation
     */
    travel(ants: Ant[]): Ant {

        let bestAnt: Ant = null;
        let bestEval: number = 0;

        for (var ant of ants) {
            while (ant.notFinished()) {
                ant.travel();
            }

            if (bestAnt == null) {
                bestAnt = ant;
                bestEval = ant.eval();
            } else if (ant.eval() < bestEval) {
                bestAnt = ant;
                bestEval = ant.eval();
            }
        }

        return bestAnt;
    }

    /**
     * Update the pheromones in the graph based on an array of ants with
     * completed tours.
     * @param ants  the ants that will be used to update the pheromones
     */
    updatePheromones(ants: Ant[]) {
        for (var ant of ants) {
            this.graph.updatePheromone(ant);
        }
    }

    /**
     * Sleep the thread for a specified amount of time.
     * @param ms    milliseconds to sleep for
     */
    delay(ms: number) {
        var cur_d = new Date();
        var cur_ticks = cur_d.getTime();
        var ms_passed = 0;
        while (ms_passed < ms) {
            var d = new Date();  // Possible memory leak?
            var ticks = d.getTime();
            ms_passed = ticks - cur_ticks;
            // d = null;  // Prevent memory leak?
        }
    }

}


class Display
{
    graph: Graph;
    network: any;
    arrVertex: { id: number, label: string, x: number, y: number }[] = [];
    arrEdges: { id: string, label: string, from: number, to: number }[] = [];
    nodes: any;
    edges: any;

    constructor(graph: Graph) {
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
            manipulation: { enabled: false }, // defined in the manipulation module.
            physics: { enabled: false }
        };
        this.network = new vis.Network(container, data, options);
    }

    drawTour(tour: Edge[]) {

        this.edges.clear();

        for (var i = 1; i < tour.length; i++) {
            var idFrom: number = this.arrVertex.filter(x => x.label == tour[i - 1].name)[0].id;
            var idTo: number = this.arrVertex.filter(x => x.label == tour[i].name)[0].id
            var labelEdge: string = (idFrom + 1) + ' - ' + (idTo + 1);

            this.edges.update({
                id: labelEdge,
                from: idFrom,
                to: idTo,
                label: labelEdge
            });
        }
    }
}

class DisplayArrows {
    graph: Graph;
    network: any;
    arrVertex: { id: number, label: string, x: number, y: number }[] = [];
    arrEdges: { id: string, label: string, from: number, to: number }[] = [];
    nodes: any;
    edges: any;

    constructor(graph: Graph) {
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
            manipulation: { enabled: false }, // defined in the manipulation module.
            physics: { enabled: false }
        };
        this.network = new vis.Network(container, data, options);
    }

    timeout(idFrom: number, idTo:number, i:number) {
        setTimeout(() => {

            this.edges.update({
                from: idFrom,
                to: idTo,
                arrows: 'to'
            });
            this.timeout(idFrom, idTo, i);
        }, 2000);
    } 

    drawTour(tour: Edge[]) {

        var clickedNode = this.nodes.get(tour[0].name);
        var nodeStart = this.nodes.get(clickedNode.id - 1);
        nodeStart.color = {
            border: '#ff0000',
            background: '#ff0000',
        }
        nodeStart.font = {
            color: '#FFFFFF'
        }
        this.nodes.update(nodeStart);

        this.edges.clear();

        for (var i = 1; i < tour.length; i++) {
            var idFrom: number = this.arrVertex.filter(x => x.label == tour[i - 1].name)[0].id;
            var idTo: number = this.arrVertex.filter(x => x.label == tour[i].name)[0].id
            var n: any;

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
            n = setTimeout(() => {
                this.edges.update({
                    from: idFrom,
                    to: idTo,
                    arrows: 'to'
                });
            }, 1000, this);
            //this.timeout(idFrom, idTo,  i);
        }
    }
}