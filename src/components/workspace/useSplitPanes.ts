import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'queryforge-workspace-layout-v1';

export const DEFAULT_LEFT_WIDTH = 45;       // 45% of workspace width
export const MIN_LEFT_WIDTH = 20;           // min 20%
export const MAX_LEFT_WIDTH = 75;           // max 75%
export const COLLAPSE_LEFT_THRESHOLD = 12;  // snap collapse if dragged below 12%

export const DEFAULT_EDITOR_HEIGHT = 58;    // 58% of right column height
export const MIN_EDITOR_HEIGHT = 25;        // min 25%
export const MAX_EDITOR_HEIGHT = 82;        // max 82%
export const COLLAPSE_CONSOLE_THRESHOLD = 90; // snap collapse console if editor > 90%

export type MaximizedPane = 'none' | 'problem' | 'editor' | 'console';

export interface SplitPanesState {
  leftWidthPct: number;
  editorHeightPct: number;
  isLeftCollapsed: boolean;
  isConsoleCollapsed: boolean;
  maximizedPane: MaximizedPane;
}

/**
 * High-Performance Zero-Jank Split Pane Hook (Locked 60fps).
 * 
 * Performance & Architecture Rules:
 * 1. Uses Pointer Events with `setPointerCapture`.
 * 2. Directly updates CSS variables (`--left-panel-width`, `--editor-panel-height`)
 *    inside `requestAnimationFrame`. React state is NOT re-rendered on every pointermove.
 * 3. Applies `data-resizing="true"` to container during drag to disable pointer events
 *    and text selection on editor/iframe contents.
 * 4. Commits to React state and `localStorage` only on `pointerup`.
 * 5. Supports double-click reset, keyboard arrow resizing, collapse, and maximize.
 */
export function useSplitPanes() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Initial state with localStorage hydration
  const [layoutState, setLayoutState] = useState<SplitPanesState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          leftWidthPct: typeof parsed.leftWidthPct === 'number' ? parsed.leftWidthPct : DEFAULT_LEFT_WIDTH,
          editorHeightPct: typeof parsed.editorHeightPct === 'number' ? parsed.editorHeightPct : DEFAULT_EDITOR_HEIGHT,
          isLeftCollapsed: Boolean(parsed.isLeftCollapsed),
          isConsoleCollapsed: Boolean(parsed.isConsoleCollapsed),
          maximizedPane: 'none', // Reset maximize on reload
        };
      }
    } catch (e) {
      // Fallback to defaults
    }
    return {
      leftWidthPct: DEFAULT_LEFT_WIDTH,
      editorHeightPct: DEFAULT_EDITOR_HEIGHT,
      isLeftCollapsed: false,
      isConsoleCollapsed: false,
      maximizedPane: 'none',
    };
  });

  // Track live dragging state without triggering re-renders
  const dragRef = useRef<{
    active: 'vertical' | 'horizontal' | null;
    startCoord: number;
    containerRect: DOMRect | null;
    rafId: number | null;
    currentLeftPct: number;
    currentEditorPct: number;
  }>({
    active: null,
    startCoord: 0,
    containerRect: null,
    rafId: null,
    currentLeftPct: layoutState.leftWidthPct,
    currentEditorPct: layoutState.editorHeightPct,
  });

  // Sync initial CSS custom properties to container DOM
  const syncCssVariables = useCallback((leftPct: number, editorPct: number) => {
    if (!containerRef.current) return;
    containerRef.current.style.setProperty('--left-panel-width', `${leftPct}%`);
    containerRef.current.style.setProperty('--editor-panel-height', `${editorPct}%`);
  }, []);

  useEffect(() => {
    syncCssVariables(
      layoutState.isLeftCollapsed ? 0 : layoutState.leftWidthPct,
      layoutState.isConsoleCollapsed ? 100 : layoutState.editorHeightPct
    );
  }, [layoutState, syncCssVariables]);

  // Persist state to localStorage on commit
  const persistState = useCallback((updated: Partial<SplitPanesState>) => {
    setLayoutState((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            leftWidthPct: next.leftWidthPct,
            editorHeightPct: next.editorHeightPct,
            isLeftCollapsed: next.isLeftCollapsed,
            isConsoleCollapsed: next.isConsoleCollapsed,
          })
        );
      } catch (e) {}
      return next;
    });
  }, []);

  // ================= VERTICAL DIVIDER (Left/Right) =================
  const onVerticalPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !containerRef.current) return;

    e.preventDefault();
    const handleEl = e.currentTarget;
    handleEl.setPointerCapture(e.pointerId);

    const rect = containerRef.current.getBoundingClientRect();
    dragRef.current = {
      active: 'vertical',
      startCoord: e.clientX,
      containerRect: rect,
      rafId: null,
      currentLeftPct: layoutState.leftWidthPct,
      currentEditorPct: layoutState.editorHeightPct,
    };

    containerRef.current.dataset.resizing = 'true';
  }, [layoutState.leftWidthPct, layoutState.editorHeightPct]);

  const onVerticalPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.active !== 'vertical' || !containerRef.current || !dragRef.current.containerRect) return;

    const { containerRect } = dragRef.current;
    const clientX = e.clientX;
    const targetEl = e.currentTarget;

    if (dragRef.current.rafId) {
      cancelAnimationFrame(dragRef.current.rafId);
    }

    dragRef.current.rafId = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const offset = clientX - containerRect.left;
      let pct = (offset / containerRect.width) * 100;

      if (pct < COLLAPSE_LEFT_THRESHOLD) {
        pct = 0;
      } else {
        pct = Math.max(MIN_LEFT_WIDTH, Math.min(MAX_LEFT_WIDTH, pct));
      }

      dragRef.current.currentLeftPct = pct;
      containerRef.current.style.setProperty('--left-panel-width', `${pct}%`);
      if (targetEl) {
        targetEl.setAttribute('aria-valuenow', Math.round(pct).toString());
      }
    });
  }, []);

  const onVerticalPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.active !== 'vertical') return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}

    if (dragRef.current.rafId) {
      cancelAnimationFrame(dragRef.current.rafId);
    }

    dragRef.current.active = null;
    if (containerRef.current) {
      delete containerRef.current.dataset.resizing;
    }

    const finalPct = dragRef.current.currentLeftPct;
    if (finalPct === 0) {
      persistState({ isLeftCollapsed: true });
    } else {
      persistState({ leftWidthPct: finalPct, isLeftCollapsed: false });
    }
  }, [persistState]);

  // ================= HORIZONTAL DIVIDER (Editor/Console) =================
  const onHorizontalPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !containerRef.current) return;

    e.preventDefault();
    const handleEl = e.currentTarget;
    handleEl.setPointerCapture(e.pointerId);

    // Measure right column container height
    const rightCol = handleEl.parentElement;
    const rect = rightCol ? rightCol.getBoundingClientRect() : containerRef.current.getBoundingClientRect();

    dragRef.current = {
      active: 'horizontal',
      startCoord: e.clientY,
      containerRect: rect,
      rafId: null,
      currentLeftPct: layoutState.leftWidthPct,
      currentEditorPct: layoutState.editorHeightPct,
    };

    containerRef.current.dataset.resizing = 'true';
  }, [layoutState.leftWidthPct, layoutState.editorHeightPct]);

  const onHorizontalPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.active !== 'horizontal' || !containerRef.current || !dragRef.current.containerRect) return;

    const { containerRect } = dragRef.current;
    const clientY = e.clientY;
    const targetEl = e.currentTarget;

    if (dragRef.current.rafId) {
      cancelAnimationFrame(dragRef.current.rafId);
    }

    dragRef.current.rafId = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const offset = clientY - containerRect.top;
      let pct = (offset / containerRect.height) * 100;

      if (pct > COLLAPSE_CONSOLE_THRESHOLD) {
        pct = 100;
      } else {
        pct = Math.max(MIN_EDITOR_HEIGHT, Math.min(MAX_EDITOR_HEIGHT, pct));
      }

      dragRef.current.currentEditorPct = pct;
      containerRef.current.style.setProperty('--editor-panel-height', `${pct}%`);
      if (targetEl) {
        targetEl.setAttribute('aria-valuenow', Math.round(pct).toString());
      }
    });
  }, []);

  const onHorizontalPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.active !== 'horizontal') return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}

    if (dragRef.current.rafId) {
      cancelAnimationFrame(dragRef.current.rafId);
    }

    dragRef.current.active = null;
    if (containerRef.current) {
      delete containerRef.current.dataset.resizing;
    }

    const finalPct = dragRef.current.currentEditorPct;
    if (finalPct === 100) {
      persistState({ isConsoleCollapsed: true });
    } else {
      persistState({ editorHeightPct: finalPct, isConsoleCollapsed: false });
    }
  }, [persistState]);

  // ================= DOUBLE CLICK TO RESET =================
  const resetVertical = useCallback(() => {
    persistState({ leftWidthPct: DEFAULT_LEFT_WIDTH, isLeftCollapsed: false });
    syncCssVariables(DEFAULT_LEFT_WIDTH, layoutState.editorHeightPct);
  }, [layoutState.editorHeightPct, persistState, syncCssVariables]);

  const resetHorizontal = useCallback(() => {
    persistState({ editorHeightPct: DEFAULT_EDITOR_HEIGHT, isConsoleCollapsed: false });
    syncCssVariables(layoutState.leftWidthPct, DEFAULT_EDITOR_HEIGHT);
  }, [layoutState.leftWidthPct, persistState, syncCssVariables]);

  // ================= KEYBOARD ACCESSIBILITY =================
  const onVerticalKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    let delta = 0;
    if (e.key === 'ArrowLeft') delta = -2;
    if (e.key === 'ArrowRight') delta = 2;
    if (e.key === 'Home') delta = MIN_LEFT_WIDTH - layoutState.leftWidthPct;
    if (e.key === 'End') delta = MAX_LEFT_WIDTH - layoutState.leftWidthPct;

    if (delta !== 0) {
      e.preventDefault();
      const nextPct = Math.max(MIN_LEFT_WIDTH, Math.min(MAX_LEFT_WIDTH, layoutState.leftWidthPct + delta));
      persistState({ leftWidthPct: nextPct, isLeftCollapsed: false });
      syncCssVariables(nextPct, layoutState.editorHeightPct);
    }
  }, [layoutState.leftWidthPct, layoutState.editorHeightPct, persistState, syncCssVariables]);

  const onHorizontalKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    let delta = 0;
    if (e.key === 'ArrowUp') delta = -2;
    if (e.key === 'ArrowDown') delta = 2;
    if (e.key === 'Home') delta = MIN_EDITOR_HEIGHT - layoutState.editorHeightPct;
    if (e.key === 'End') delta = MAX_EDITOR_HEIGHT - layoutState.editorHeightPct;

    if (delta !== 0) {
      e.preventDefault();
      const nextPct = Math.max(MIN_EDITOR_HEIGHT, Math.min(MAX_EDITOR_HEIGHT, layoutState.editorHeightPct + delta));
      persistState({ editorHeightPct: nextPct, isConsoleCollapsed: false });
      syncCssVariables(layoutState.leftWidthPct, nextPct);
    }
  }, [layoutState.leftWidthPct, layoutState.editorHeightPct, persistState, syncCssVariables]);

  // ================= MAXIMIZE & COLLAPSE CONTROLS =================
  const toggleMaximize = useCallback((pane: MaximizedPane) => {
    setLayoutState((prev) => ({
      ...prev,
      maximizedPane: prev.maximizedPane === pane ? 'none' : pane,
    }));
  }, []);

  const toggleCollapseLeft = useCallback(() => {
    setLayoutState((prev) => {
      const next = !prev.isLeftCollapsed;
      persistState({ isLeftCollapsed: next });
      return { ...prev, isLeftCollapsed: next };
    });
  }, [persistState]);

  const toggleCollapseConsole = useCallback(() => {
    setLayoutState((prev) => {
      const next = !prev.isConsoleCollapsed;
      persistState({ isConsoleCollapsed: next });
      return { ...prev, isConsoleCollapsed: next };
    });
  }, [persistState]);

  return {
    containerRef,
    layoutState,
    verticalProps: {
      onPointerDown: onVerticalPointerDown,
      onPointerMove: onVerticalPointerMove,
      onPointerUp: onVerticalPointerUp,
      onDoubleClick: resetVertical,
      onKeyDown: onVerticalKeyDown,
      role: 'separator' as const,
      tabIndex: 0,
      'aria-orientation': 'vertical' as const,
      'aria-valuenow': Math.round(layoutState.leftWidthPct),
      'aria-valuemin': MIN_LEFT_WIDTH,
      'aria-valuemax': MAX_LEFT_WIDTH,
      'aria-label': 'Resize problem description panel',
    },
    horizontalProps: {
      onPointerDown: onHorizontalPointerDown,
      onPointerMove: onHorizontalPointerMove,
      onPointerUp: onHorizontalPointerUp,
      onDoubleClick: resetHorizontal,
      onKeyDown: onHorizontalKeyDown,
      role: 'separator' as const,
      tabIndex: 0,
      'aria-orientation': 'horizontal' as const,
      'aria-valuenow': Math.round(layoutState.editorHeightPct),
      'aria-valuemin': MIN_EDITOR_HEIGHT,
      'aria-valuemax': MAX_EDITOR_HEIGHT,
      'aria-label': 'Resize SQL code editor panel',
    },
    toggleMaximize,
    toggleCollapseLeft,
    toggleCollapseConsole,
  };
}
