import { Q } from '@nozbe/watermelondb';
import { database } from '../db/database';
import seedData from '../../../assets/seed/philosophie-der-freiheit.json';

const LOCAL_USER = 'local';

type SeedParagraph = {
  paragraph_id: string;
  source_id: string;
  segment_index: number;
  segment_title: string;
  paragraph_number: number;
  text_raw: string;
  annotations: Record<string, unknown> | null;
};

type SeedTalk = {
  talk_id: string;
  user_id?: string;         // Supabase auth.uid() (= mensch_id in ragrun)
  collection: string;
  title: string;
  summary?: string;
  kontext_paragraph_id?: string;
  context_paragraph_id?: string; // legacy seed field → mapped to kontext_paragraph_id
};

type SeedTurn = {
  talk_id: string;
  turn_index: number;
  personality: string;
  user_message: string;
  assistant_message: string;
  chunk_index_map?: Record<string, number>;
};

type SeedReference = {
  ref_id: string;
  turn_id?: string;
  chunk_id?: string;
  ref_index: number;
  relevance?: number;
  source_title: string;
  segment_title: string;
};

export async function seedIfEmpty(): Promise<void> {
  const paragraphCollection = database.get('paragraphs');
  const count = await paragraphCollection.query().fetchCount();
  if (count > 0) return;

  await database.write(async () => {
    for (const p of seedData.paragraphs as SeedParagraph[]) {
      await paragraphCollection.create((record: any) => {
        record.paragraphId    = p.paragraph_id;
        record.sourceId       = p.source_id;
        record.language       = seedData.language;
        record.segmentIndex   = p.segment_index;
        record.segmentTitle   = p.segment_title;
        record.paragraphNumber= p.paragraph_number;
        record.textRaw        = p.text_raw;
        record.annotations    = p.annotations;
      });
    }
  });
}

/** Erwartete Anzahl Demo-Gespräche — bei weniger wird in __DEV__ neu eingespielt. */
const DEMO_TALK_COUNT = 6;
/** Mindest-Turns für Kern-Demos (mehr-Runden-Gespräche aus CSV-Beispielen). */
const DEMO_FREIHEIT_1_TALK_ID = 'demo-talk-freiheit-1';
const DEMO_FREIHEIT_1_MIN_TURNS = 3;
const DEMO_BANK_TALK_ID = 'demo-talk-bank-dreigliederung';
const DEMO_BANK_MIN_TURNS = 4;

/** Demo-Gespräche und RAG-Treffer (lokaler Spiegel von rag_talks / rag_turns / rag_references). */
export async function seedDemoContributionsIfEmpty(): Promise<void> {
  const talkCollection = database.get('talks');
  const turnCollection = database.get('turns');
  const refCollection = database.get('references');
  const talkCount = await talkCollection.query().fetchCount();
  const turnCount = await turnCollection.query().fetchCount();
  const expectedTurnCount = ((seedData as { turns?: SeedTurn[] }).turns ?? []).length;
  const [freiheit1Turns, bankTurns] = await Promise.all([
    turnCollection.query(Q.where('talk_id', DEMO_FREIHEIT_1_TALK_ID)).fetchCount(),
    turnCollection.query(Q.where('talk_id', DEMO_BANK_TALK_ID)).fetchCount(),
  ]);
  const demoTurnsStale =
    freiheit1Turns < DEMO_FREIHEIT_1_MIN_TURNS || bankTurns < DEMO_BANK_MIN_TURNS;

  const shouldReseedDev =
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    talkCount > 0 &&
    (talkCount < DEMO_TALK_COUNT || turnCount < expectedTurnCount || demoTurnsStale);

  if (talkCount > 0 && !shouldReseedDev) return;

  if (shouldReseedDev) {
    const [talks, turns, refs] = await Promise.all([
      talkCollection.query().fetch(),
      turnCollection.query().fetch(),
      refCollection.query().fetch(),
    ]);
    await database.write(async () => {
      for (const row of [...turns, ...refs, ...talks]) {
        await row.destroyPermanently();
      }
    });
  }

  const seedTalks = (seedData as { talks?: SeedTalk[] }).talks ?? [];
  const seedTurns = (seedData as { turns?: SeedTurn[] }).turns ?? [];
  const seedReferences = (seedData as { references?: SeedReference[] }).references ?? [];

  await database.write(async () => {
    for (const t of seedTalks) {
      await talkCollection.create((talk: any) => {
        talk._raw.id             = t.talk_id;   // WatermelonDB id = talk_id
        talk.userId              = t.user_id ?? LOCAL_USER;
        talk.collectionName      = t.collection;
        talk.title               = t.title;
        talk.summary             = t.summary ?? null;
        talk.kontextParagraphId    = t.kontext_paragraph_id ?? t.context_paragraph_id ?? null;
        talk.publishingStatus    = 'personal';
      });
    }

    for (const t of seedTurns) {
      await turnCollection.create((turn: any) => {
        turn.talkId = t.talk_id;
        turn.turnIndex = t.turn_index;
        turn.personality = t.personality;
        turn.userMessage = t.user_message;
        turn.assistantMessage = t.assistant_message;
        turn.chunkIndexMap = t.chunk_index_map ?? null;
      });
    }

    for (const r of seedReferences) {
      await refCollection.create((ref: any) => {
        ref.turnId       = r.turn_id ?? null;
        ref.chunkId      = r.chunk_id ?? null;
        ref.refIndex     = r.ref_index;
        ref.relevance    = r.relevance ?? null;
        ref.sourceTitle  = r.source_title;
        ref.segmentTitle = r.segment_title;
      });
    }
  });
}
