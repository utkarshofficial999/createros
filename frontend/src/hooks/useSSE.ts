import { useState, useCallback, useRef } from 'react';

export interface SSEStageEvent {
  stage: string;
  status: 'running' | 'done';
  preview?: string;
  attempt?: number;
  score?: number;
  strategy?: any;
  review?: any;
  repurposed?: any;
  chosen_hook?: string;
}

export interface SSEDoneEvent {
  post_id: number;
  run_id: string;
  title: string;
  main_content: string;
  linkedin_post: string;
  x_thread: string[];
  instagram_caption: string;
  strategy: any;
  review: any;
  features: any;
}

export function useSSE() {
  const [stages, setStages] = useState<SSEStageEvent[]>([]);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [donePayload, setDonePayload] = useState<SSEDoneEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startStream = useCallback((streamUrl: string, onFinish?: (payload: SSEDoneEvent) => void) => {
    // Reset state
    setStages([]);
    setActiveStage("strategy");
    setIsStreaming(true);
    setDonePayload(null);
    setError(null);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.addEventListener("stage", (e: MessageEvent) => {
      try {
        const data: SSEStageEvent = JSON.parse(e.data);
        setActiveStage(data.stage);
        setStages((prev) => [...prev, data]);
      } catch (err) {
        console.error("Failed to parse stage event:", err);
      }
    });

    es.addEventListener("done", (e: MessageEvent) => {
      try {
        const data: SSEDoneEvent = JSON.parse(e.data);
        setDonePayload(data);
        setIsStreaming(false);
        setActiveStage(null);
        es.close();
        if (onFinish) {
          onFinish(data);
        }
      } catch (err) {
        console.error("Failed to parse done event:", err);
      }
    });

    es.addEventListener("error", (e) => {
      console.warn("SSE stream ended or encountered an error", e);
      setIsStreaming(false);
      es.close();
    });
  }, []);

  const cancelStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  return {
    stages,
    activeStage,
    isStreaming,
    donePayload,
    error,
    startStream,
    cancelStream
  };
}
