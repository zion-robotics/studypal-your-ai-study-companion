import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type StudySession = {
  id: string;
  subject: string;
  topic?: string;
  score: number | null;
  duration_min?: number;
  created_at: string;
};

export type SubjectProgress = {
  subject: string;
  coverage_pct: number;
};

export type DashboardData = {
  sessions: StudySession[];
  subjectProgress: SubjectProgress[];
  streak: number;
  totalSessions: number;
  avgScore: number;
  pastQDone: number;
  loading: boolean;
};

export function useDashboardData(subjects: string[]): DashboardData {
  const [state, setState] = useState<DashboardData>({
    sessions: [],
    subjectProgress: [],
    streak: 0,
    totalSessions: 0,
    avgScore: 0,
    pastQDone: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setState((s) => ({ ...s, loading: false }));
          return;
        }

        const { data: sessionsData } = await supabase
          .from("study_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        const sessions: StudySession[] = (sessionsData ?? []) as StudySession[];

        const totalSessions = sessions.length;
        const scored = sessions.filter((s) => typeof s.score === "number");
        const avgScore = scored.length
          ? Math.round(scored.reduce((a, b) => a + (b.score ?? 0), 0) / scored.length)
          : 0;

        const subjectProgress: SubjectProgress[] = subjects.map((subject) => {
          const subjectSessions = sessions.filter((s) => s.subject === subject);
          const avg = subjectSessions.length
            ? Math.round(
                subjectSessions.reduce((a, b) => a + (b.score ?? 0), 0) /
                  subjectSessions.length,
              )
            : 0;
          return { subject, coverage_pct: avg };
        });

        const days = new Set(
          sessions.map((s) => new Date(s.created_at).toDateString()),
        );
        let streak = 0;
        const cursor = new Date();
        while (days.has(cursor.toDateString())) {
          streak += 1;
          cursor.setDate(cursor.getDate() - 1);
        }

        if (!cancelled) {
          setState({
            sessions,
            subjectProgress,
            streak,
            totalSessions,
            avgScore,
            pastQDone: totalSessions,
            loading: false,
          });
        }
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [subjects.join("|")]);

  return state;
}

export function getActivityMap(sessions: StudySession[]): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const s of sessions) {
    const key = new Date(s.created_at).toISOString().slice(0, 10);
    map[key] = true;
  }
  return map;
}