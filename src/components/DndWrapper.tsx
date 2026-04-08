import { ReactNode } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface DndWrapperProps {
  children: ReactNode;
}

export function DndWrapper({ children }: DndWrapperProps) {
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
}
