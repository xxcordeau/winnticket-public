import { useState, useEffect } from "react";
import {
  entityStore,
  type EntityInfo,
  type EntityRelationship,
  type NodePosition,
} from "../entities";

export function useEntities() {
  const [entities, setEntities] = useState<EntityInfo[]>([]);
  const [relationships, setRelationships] = useState<EntityRelationship[]>([]);
  const [nodePositions, setNodePositions] = useState<NodePosition[]>([]);

  useEffect(() => {
    const updateData = () => {
      setEntities(entityStore.getEntities());
      setRelationships(entityStore.getRelationships());
      setNodePositions(entityStore.getNodePositions());
    };

    updateData();
    const unsubscribe = entityStore.subscribe(updateData);

    return () => unsubscribe();
  }, []);

  return {
    entities,
    relationships,
    nodePositions,
    addEntity: (entity: EntityInfo) => entityStore.addEntity(entity),
    updateEntity: (id: string, updates: Partial<EntityInfo>) =>
      entityStore.updateEntity(id, updates),
    deleteEntity: (id: string) => entityStore.deleteEntity(id),
    addRelationship: (relationship: EntityRelationship) =>
      entityStore.addRelationship(relationship),
    updateRelationship: (id: string, updates: Partial<EntityRelationship>) =>
      entityStore.updateRelationship(id, updates),
    deleteRelationship: (id: string) => entityStore.deleteRelationship(id),
    updateNodePosition: (id: string, x: number, y: number) =>
      entityStore.updateNodePosition(id, x, y),
    updateNodePositions: (positions: NodePosition[]) =>
      entityStore.updateNodePositions(positions),
    resetToDefaults: () => entityStore.resetToDefaults(),
  };
}
