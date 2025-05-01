// src/parser.ts
// Using 'any' types for simplicity in parsing scene data
export interface ParsedScene {
  elements: any[];
  appState: any;
  dashedArrows: any[];
}

export function parseScene(data: any): ParsedScene {
  if (!data || !Array.isArray(data.elements) || data.appState == null) {
    throw new Error("Invalid Excalidraw JSON: missing elements or appState.");
  }
  const elements = data.elements as any[];
  const dashedArrows = elements.filter((el) =>
    (el.type === "arrow" || el.type === "line") && el.strokeStyle === "dashed"
  );
  return {
    elements,
    appState: data.appState,
    dashedArrows,
  };
} 