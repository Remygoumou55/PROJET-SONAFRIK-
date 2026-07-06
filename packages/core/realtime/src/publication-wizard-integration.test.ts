import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPublicationWizardPublisher,
  PUBLICATION_WIZARD_EVENT_MAP,
} from "../src/adapters/publication-wizard-publisher";
import { SynchronizationEngine } from "../src/engine/synchronization-engine";
import { resetEventRegistryForTests } from "../src/registry/event-registry";
import { SRTSP_DOMAIN_EVENTS } from "../src/registry/domain-events";

const CTX = {
  albumId: "aa0e8400-e29b-41d4-a716-446655440000",
  trackId: "550e8400-e29b-41d4-a716-446655440000",
  creatorId: "660e8400-e29b-41d4-a716-446655440001",
  title: "Mon Beau Pays",
};

describe("Publication Wizard SRTSP adapter", () => {
  beforeEach(() => resetEventRegistryForTests());

  it("émet les événements avec contrat registry valide", () => {
    const publish = vi.fn();
    const publisher = createPublicationWizardPublisher(publish);
    publisher.draftCreated(CTX);
    publisher.audioUploaded(CTX);
    publisher.coverUploaded(CTX);
    publisher.metadataCompleted(CTX);
    publisher.submitted(CTX);
    expect(publish).toHaveBeenCalledTimes(5);
    for (const call of publish.mock.calls) {
      expect(call[0].source).toBe("publication");
      expect(call[0].metadata?.channel).toBe("publication-wizard");
    }
  });

  it("cartographie officielle couvre toutes les actions wizard", () => {
    expect(PUBLICATION_WIZARD_EVENT_MAP.step1_createRelease).toBe(
      SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_CREATED,
    );
    expect(PUBLICATION_WIZARD_EVENT_MAP.step4_submitted).toBe(
      SRTSP_DOMAIN_EVENTS.PUBLICATION_SUBMITTED,
    );
  });
});

describe("Publication Wizard SRTSP E2E flow", () => {
  beforeEach(() => resetEventRegistryForTests());

  it("propagation complète wizard → bus → abonné publications", () => {
    const engine = new SynchronizationEngine();
    const received: string[] = [];
    engine.subscribe({ destination: "publications" }, (event) => {
      received.push(event.name);
    });
    const publisher = createPublicationWizardPublisher((input) => {
      engine.publish(input);
    });

    publisher.draftCreated(CTX);
    publisher.audioUploaded(CTX);
    publisher.coverUploaded(CTX);
    publisher.metadataCompleted(CTX);
    publisher.submitted(CTX);

    expect(received).toEqual([
      SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_CREATED,
      SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED,
      SRTSP_DOMAIN_EVENTS.PUBLICATION_COVER_UPLOADED,
      SRTSP_DOMAIN_EVENTS.PUBLICATION_METADATA_COMPLETED,
      SRTSP_DOMAIN_EVENTS.PUBLICATION_SUBMITTED,
    ]);
    expect(engine.getMetrics().events.received).toBe(5);
  });

  it("annulation et brouillon mis à jour", () => {
    const engine = new SynchronizationEngine();
    const received: string[] = [];
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.PUBLICATION_CANCELLED }, (e) => {
      received.push(e.name);
    });
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_UPDATED }, (e) => {
      received.push(e.name);
    });
    const publisher = createPublicationWizardPublisher((input) => engine.publish(input));
    publisher.draftUpdated(CTX);
    publisher.cancelled(CTX);
    expect(received).toHaveLength(2);
  });

  it("rejet si payload invalide", () => {
    const engine = new SynchronizationEngine();
    const publisher = createPublicationWizardPublisher((input) => engine.publish(input));
    expect(() =>
      publisher.submitted({
        albumId: "bad",
        trackId: CTX.trackId,
        creatorId: CTX.creatorId,
      }),
    ).toThrow();
    expect(engine.getMetrics().events.rejected).toBe(1);
  });
});
