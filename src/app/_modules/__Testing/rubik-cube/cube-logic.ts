// Standard color mapping
export type Color = 'W' | 'Y' | 'R' | 'O' | 'G' | 'B'; // White, Yellow, Red, Orange, Green, Blue

export type Move = 'R' | 'R\'' | 'R2' | 'L' | 'L\'' | 'L2' | 
                  'U' | 'U\'' | 'U2' | 'D' | 'D\'' | 'D2' | 
                  'F' | 'F\'' | 'F2' | 'B' | 'B\'' | 'B2';

export class CubeLogic {
  // Each face is 3x3 array of colors
  public faces!: {
        U: Color[][]; // Up (white)
        D: Color[][]; // Down (yellow)
        F: Color[][]; // Front (red)
        B: Color[][]; // Back (orange)
        L: Color[][]; // Left (green)
        R: Color[][];
    };

  constructor() {
    this.reset();
  }

  reset(): void {
    this.faces = {
      U: [['W', 'W', 'W'], ['W', 'W', 'W'], ['W', 'W', 'W']],
      D: [['Y', 'Y', 'Y'], ['Y', 'Y', 'Y'], ['Y', 'Y', 'Y']],
      F: [['R', 'R', 'R'], ['R', 'R', 'R'], ['R', 'R', 'R']],
      B: [['O', 'O', 'O'], ['O', 'O', 'O'], ['O', 'O', 'O']],
      L: [['G', 'G', 'G'], ['G', 'G', 'G'], ['G', 'G', 'G']],
      R: [['B', 'B', 'B'], ['B', 'B', 'B'], ['B', 'B', 'B']]
    };
  }

  isSolved(): boolean {
    const faces = ['U', 'D', 'F', 'B', 'L', 'R'] as const;
    for (const face of faces) {
      const color = this.faces[face][1][1]; // center defines the face color
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (this.faces[face][i][j] !== color) return false;
        }
      }
    }
    return true;
  }

  // Rotate a face clockwise (90°)
  private rotateFaceClockwise(face: Color[][]): void {
    const temp = face[0][0];
    face[0][0] = face[2][0];
    face[2][0] = face[2][2];
    face[2][2] = face[0][2];
    face[0][2] = temp;

    const temp2 = face[0][1];
    face[0][1] = face[1][0];
    face[1][0] = face[2][1];
    face[2][1] = face[1][2];
    face[1][2] = temp2;
  }

  // Rotate a face counter-clockwise
  private rotateFaceCounterClockwise(face: Color[][]): void {
    this.rotateFaceClockwise(face);
    this.rotateFaceClockwise(face);
    this.rotateFaceClockwise(face);
  }

  // Apply a single move
  move(m: Move): void {
    switch (m) {
      case 'R':
        this.rotateFaceClockwise(this.faces.R);
        this.cycleEdges([
          [this.faces.U[0][2], this.faces.U[1][2], this.faces.U[2][2]],
          [this.faces.F[0][2], this.faces.F[1][2], this.faces.F[2][2]],
          [this.faces.D[0][2], this.faces.D[1][2], this.faces.D[2][2]],
          [this.faces.B[2][0], this.faces.B[1][0], this.faces.B[0][0]]
        ]);
        break;
      case 'R\'':
        this.move('R');
        this.move('R');
        this.move('R');
        break;
      case 'R2':
        this.move('R');
        this.move('R');
        break;

      case 'L':
        this.rotateFaceClockwise(this.faces.L);
        this.cycleEdges([
          [this.faces.U[0][0], this.faces.U[1][0], this.faces.U[2][0]],
          [this.faces.B[2][2], this.faces.B[1][2], this.faces.B[0][2]],
          [this.faces.D[0][0], this.faces.D[1][0], this.faces.D[2][0]],
          [this.faces.F[0][0], this.faces.F[1][0], this.faces.F[2][0]]
        ]);
        break;
      case 'L\'':
        this.move('L');
        this.move('L');
        this.move('L');
        break;
      case 'L2':
        this.move('L');
        this.move('L');
        break;

      case 'U':
        this.rotateFaceClockwise(this.faces.U);
        this.cycleEdges([
          [this.faces.F[0][0], this.faces.F[0][1], this.faces.F[0][2]],
          [this.faces.L[0][0], this.faces.L[0][1], this.faces.L[0][2]],
          [this.faces.B[0][0], this.faces.B[0][1], this.faces.B[0][2]],
          [this.faces.R[0][0], this.faces.R[0][1], this.faces.R[0][2]]
        ]);
        break;
      case 'U\'':
        this.move('U');
        this.move('U');
        this.move('U');
        break;
      case 'U2':
        this.move('U');
        this.move('U');
        break;

      case 'D':
        this.rotateFaceClockwise(this.faces.D);
        this.cycleEdges([
          [this.faces.F[2][0], this.faces.F[2][1], this.faces.F[2][2]],
          [this.faces.R[2][0], this.faces.R[2][1], this.faces.R[2][2]],
          [this.faces.B[2][0], this.faces.B[2][1], this.faces.B[2][2]],
          [this.faces.L[2][0], this.faces.L[2][1], this.faces.L[2][2]]
        ]);
        break;
      case 'D\'':
        this.move('D');
        this.move('D');
        this.move('D');
        break;
      case 'D2':
        this.move('D');
        this.move('D');
        break;

      case 'F':
        this.rotateFaceClockwise(this.faces.F);
        this.cycleEdges([
          [this.faces.U[2][0], this.faces.U[2][1], this.faces.U[2][2]],
          [this.faces.R[0][0], this.faces.R[1][0], this.faces.R[2][0]],
          [this.faces.D[0][2], this.faces.D[0][1], this.faces.D[0][0]],
          [this.faces.L[2][2], this.faces.L[1][2], this.faces.L[0][2]]
        ]);
        break;
      case 'F\'':
        this.move('F');
        this.move('F');
        this.move('F');
        break;
      case 'F2':
        this.move('F');
        this.move('F');
        break;

      case 'B':
        this.rotateFaceClockwise(this.faces.B);
        this.cycleEdges([
          [this.faces.U[0][2], this.faces.U[0][1], this.faces.U[0][0]],
          [this.faces.L[0][0], this.faces.L[1][0], this.faces.L[2][0]],
          [this.faces.D[2][0], this.faces.D[2][1], this.faces.D[2][2]],
          [this.faces.R[2][2], this.faces.R[1][2], this.faces.R[0][2]]
        ]);
        break;
      case 'B\'':
        this.move('B');
        this.move('B');
        this.move('B');
        break;
      case 'B2':
        this.move('B');
        this.move('B');
        break;
    }
  }

  private cycleEdges(groups: Color[][]): void {
    const temp = [...groups[3]];
    groups[3][0] = groups[2][0]; groups[3][1] = groups[2][1]; groups[3][2] = groups[2][2];
    groups[2][0] = groups[1][0]; groups[2][1] = groups[1][1]; groups[2][2] = groups[1][2];
    groups[1][0] = groups[0][0]; groups[1][1] = groups[0][1]; groups[1][2] = groups[0][2];
    groups[0][0] = temp[0]; groups[0][1] = temp[1]; groups[0][2] = temp[2];
  }

  // Generate random scramble (valid sequence)
  scramble(steps = 20): Move[] {
    const moves: Move[] = ['R', 'R\'', 'L', 'L\'', 'U', 'U\'', 'D', 'D\'', 'F', 'F\'', 'B', 'B\''];
    const scramble: Move[] = [];
    let lastAxis = '';

    for (let i = 0; i < steps; i++) {
      let move: Move;
      let axis: string;
      do {
        move = moves[Math.floor(Math.random() * moves.length)];
        axis = move.charAt(0);
      } while (axis === lastAxis); // avoid redundant moves on same face

      scramble.push(move);
      this.move(move);
      lastAxis = axis;
    }

    return scramble;
  }

  // Very simple solver: just reverse the scramble (for demo purposes)
  // In a real app, you'd plug in Kociemba or beginner's method
  solveByReversingScramble(scramble: Move[]): Move[] {
    const reverseMap: Record<string, Move> = {
      'R': 'R\'', 'R\'': 'R', 'R2': 'R2',
      'L': 'L\'', 'L\'': 'L', 'L2': 'L2',
      'U': 'U\'', 'U\'': 'U', 'U2': 'U2',
      'D': 'D\'', 'D\'': 'D', 'D2': 'D2',
      'F': 'F\'', 'F\'': 'F', 'F2': 'F2',
      'B': 'B\'', 'B\'': 'B', 'B2': 'B2'
    };

    return scramble.reverse().map(m => reverseMap[m]);
  }
}