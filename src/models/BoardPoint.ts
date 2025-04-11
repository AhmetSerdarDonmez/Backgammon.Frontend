import { Checker } from './Checker';

// Represents one of the 24 points (triangles) on the board
export interface BoardPoint {
    pointIndex: number; // 1-24
    checkers: Checker[];
}