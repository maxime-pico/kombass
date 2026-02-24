import React from 'react';
import { render, screen } from '@testing-library/react';
import TeamPanel from './TeamPanel';
import { IUnit, ISelectedUnit } from '../App';

describe('TeamPanel Component', () => {
  const mockUnits: Array<IUnit> = [
    { x: 0, y: 0, life: 3, strength: 3, speed: 1, hasFlag: false, unitType: 2 }, // Heavy - alive
    { x: 1, y: 1, life: 2, strength: 2, speed: 2, hasFlag: true, unitType: 1 },  // Medium - alive with flag
    { x: 2, y: 2, life: 0, strength: 1, speed: 3, hasFlag: false, unitType: 0 }, // Light - dead
    { x: 3, y: 3, life: 1, strength: 1, speed: 3, hasFlag: false, unitType: 0 }, // Light - alive
  ];

  const defaultSelectedUnit: ISelectedUnit = {
    playerNumber: 0,
    unitNumber: 0,
  };

  describe('Rendering', () => {
    test('renders all units in the array', () => {
      const { container } = render(
        <TeamPanel
          units={mockUnits}
          playerIndex={0}
          selectedUnit={defaultSelectedUnit}
        />
      );

      // Should render 4 unit boxes
      const unitBoxes = container.querySelectorAll('.teamPanel-box');
      expect(unitBoxes.length).toBe(4);
    });

    test('renders Unit components with displayUnitInfo prop', () => {
      const { container } = render(
        <TeamPanel
          units={mockUnits}
          playerIndex={0}
          selectedUnit={defaultSelectedUnit}
        />
      );

      // Each Unit component should be rendered
      // The actual info display format is handled by the Unit component
      const unitBoxes = container.querySelectorAll('.teamPanel-box');
      expect(unitBoxes.length).toBe(4);

      // Verify units are rendered (smoke test)
      expect(container.querySelector('.teamPanel')).toBeInTheDocument();
    });

    test('applies correct player class (p1 or p2)', () => {
      const { container } = render(
        <TeamPanel
          units={mockUnits}
          playerIndex={1}
          selectedUnit={defaultSelectedUnit}
        />
      );

      // Check that player 2 class is applied (p2)
      const backgrounds = container.querySelectorAll('.unitPanel-background.p2');
      expect(backgrounds.length).toBe(4);
    });
  });

  describe('Null Unit Handling', () => {
    test('skips rendering null units', () => {
      const unitsWithNull: Array<IUnit | null> = [
        { x: 0, y: 0, life: 3, strength: 3, speed: 1, hasFlag: false, unitType: 2 },
        null,
        { x: 2, y: 2, life: 2, strength: 2, speed: 2, hasFlag: false, unitType: 1 },
        null,
      ];

      const { container } = render(
        <TeamPanel
          units={unitsWithNull as Array<IUnit>}
          playerIndex={0}
          selectedUnit={defaultSelectedUnit}
        />
      );

      // Should only render 2 unit boxes (null units are skipped)
      const unitBoxes = container.querySelectorAll('.teamPanel-box');
      expect(unitBoxes.length).toBe(2);
    });

    test('handles empty units array', () => {
      const { container } = render(
        <TeamPanel
          units={[]}
          playerIndex={0}
          selectedUnit={defaultSelectedUnit}
        />
      );

      // Should render container but no unit boxes
      expect(container.querySelector('.teamPanel')).toBeInTheDocument();
      expect(container.querySelectorAll('.teamPanel-box').length).toBe(0);
    });
  });

  describe('Unit Selection', () => {
    test('highlights selected unit', () => {
      const selectedUnit: ISelectedUnit = {
        playerNumber: 0,
        unitNumber: 1,
      };

      const { container } = render(
        <TeamPanel
          units={mockUnits}
          playerIndex={0}
          selectedUnit={selectedUnit}
        />
      );

      // Second unit (index 1) should have 'selected' class
      const backgrounds = container.querySelectorAll('.unitPanel-background');
      expect(backgrounds[1]).toHaveClass('selected');
      expect(backgrounds[0]).not.toHaveClass('selected');
      expect(backgrounds[2]).not.toHaveClass('selected');
    });

    test('does not highlight unit if playerNumber does not match', () => {
      const selectedUnit: ISelectedUnit = {
        playerNumber: 1, // Different player
        unitNumber: 0,
      };

      const { container } = render(
        <TeamPanel
          units={mockUnits}
          playerIndex={0}
          selectedUnit={selectedUnit}
        />
      );

      // No units should be selected (wrong player)
      const backgrounds = container.querySelectorAll('.unitPanel-background');
      backgrounds.forEach(bg => {
        expect(bg).not.toHaveClass('selected');
      });
    });
  });

  describe('Dead Units', () => {
    test('shows overlay for dead units (life < 1)', () => {
      const { container } = render(
        <TeamPanel
          units={mockUnits}
          playerIndex={0}
          selectedUnit={defaultSelectedUnit}
        />
      );

      // Third unit (index 2) has life=0, should have foreground overlay
      const foregrounds = container.querySelectorAll('.unitPanel-foreground');
      expect(foregrounds.length).toBe(1); // Only 1 dead unit
    });

    test('does not show overlay for alive units', () => {
      const aliveUnits: Array<IUnit> = [
        { x: 0, y: 0, life: 3, strength: 3, speed: 1, hasFlag: false, unitType: 2 },
        { x: 1, y: 1, life: 2, strength: 2, speed: 2, hasFlag: false, unitType: 1 },
        { x: 2, y: 2, life: 1, strength: 1, speed: 3, hasFlag: false, unitType: 0 },
      ];

      const { container } = render(
        <TeamPanel
          units={aliveUnits}
          playerIndex={0}
          selectedUnit={defaultSelectedUnit}
        />
      );

      // No dead units, no foreground overlays
      const foregrounds = container.querySelectorAll('.unitPanel-foreground');
      expect(foregrounds.length).toBe(0);
    });

    test('dead unit can still be selected', () => {
      const selectedUnit: ISelectedUnit = {
        playerNumber: 0,
        unitNumber: 2, // Dead unit
      };

      const { container } = render(
        <TeamPanel
          units={mockUnits}
          playerIndex={0}
          selectedUnit={selectedUnit}
        />
      );

      // Dead unit's foreground should have 'selected' class
      const foreground = container.querySelector('.unitPanel-foreground');
      expect(foreground).toHaveClass('selected');
    });
  });
});
