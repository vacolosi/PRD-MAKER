/**
 * Sanitized input-only transcription of the workbook Calc Ex (E.L.) rows 13–104.
 * No workbook formulas, results, topology, client metadata, or reference-library data is retained.
 */
import { HYDRONIC_PRESSURE_DROP_SCHEMA, HYDRONIC_REFERENCE_DATA_VERSION, type HydronicProject, type LossElement, type LossElementData, type Section } from '../engine/index.js';

type SourceLoss = LossElementData & { readonly id: string };
type SourceSection = {
  readonly number: number;
  readonly stream: 'CHWS' | 'CHWR';
  readonly nominal: number;
  readonly length: number;
  readonly geometry: Section['geometry'];
  readonly losses: readonly SourceLoss[];
};
export interface WorkbookReferenceRow {
  readonly sectionId: string;
  readonly stream: 'CHWS' | 'CHWR';
  readonly traceLabel: string;
  readonly workbookStoredReferenceFlowGpm: number;
  readonly nominalPipeIn: number;
  readonly actualLengthFt: number;
  readonly geometry: Section['geometry'];
  readonly primitives: readonly LossElementData[];
}

const envelope = 'Legacy input transcription requires engineer review for the current applicability basis.';
const sourceSections: readonly SourceSection[] = [
  {
    "number": 1,
    "stream": "CHWR",
    "nominal": 10.0,
    "length": 15.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-10"
    },
    "losses": [
      {
        "id": "section-01-90-reducing-elbow-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 13.4,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-01-globe-silent-check-valve-1",
        "type": "direct-psi",
        "category": "equipment",
        "quantity": 1.0,
        "pressureLossPsi": 1.0
      },
      {
        "id": "section-01-butterfly-valve-1",
        "type": "equivalent-length",
        "category": "valve",
        "quantity": 1.0,
        "equivalentLengthFt": 29.2,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 2,
    "stream": "CHWR",
    "nominal": 14.0,
    "length": 10.0,
    "geometry": {
      "kind": "custom",
      "actualInsideDiameterIn": 13.25,
      "roughnessFt": 0.00015
    },
    "losses": [
      {
        "id": "section-02-tee-through-branch-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 65.6,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 3,
    "stream": "CHWR",
    "nominal": 14.0,
    "length": 10.0,
    "geometry": {
      "kind": "custom",
      "actualInsideDiameterIn": 13.25,
      "roughnessFt": 0.00015
    },
    "losses": [
      {
        "id": "section-03-tee-through-main-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 21.8,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 4,
    "stream": "CHWR",
    "nominal": 14.0,
    "length": 15.0,
    "geometry": {
      "kind": "custom",
      "actualInsideDiameterIn": 13.25,
      "roughnessFt": 0.00015
    },
    "losses": [
      {
        "id": "section-04-90-l-r-elbow-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 17.5,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 5,
    "stream": "CHWR",
    "nominal": 10.0,
    "length": 40.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-10"
    },
    "losses": [
      {
        "id": "section-05-14x10-reducer-contraction-1",
        "type": "k",
        "category": "fitting",
        "quantity": 1.0,
        "k": 0.21,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-05-90-l-r-elbow-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 3.0,
        "equivalentLengthFt": 13.4,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-05-butterfly-valve-1",
        "type": "equivalent-length",
        "category": "valve",
        "quantity": 1.0,
        "equivalentLengthFt": 29.2,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 6,
    "stream": "CHWS",
    "nominal": 10.0,
    "length": 40.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-10"
    },
    "losses": [
      {
        "id": "section-06-chiller-pressure-drop-1",
        "type": "direct-psi",
        "category": "equipment",
        "quantity": 1.0,
        "pressureLossPsi": 6.5
      },
      {
        "id": "section-06-90-l-r-elbow-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 2.0,
        "equivalentLengthFt": 13.4,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-06-14x10-reducer-enlargement-1",
        "type": "k",
        "category": "fitting",
        "quantity": 1.0,
        "k": 0.24,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-06-butterfly-valve-1",
        "type": "equivalent-length",
        "category": "valve",
        "quantity": 2.0,
        "equivalentLengthFt": 29.2,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 7,
    "stream": "CHWS",
    "nominal": 14.0,
    "length": 180.0,
    "geometry": {
      "kind": "custom",
      "actualInsideDiameterIn": 13.25,
      "roughnessFt": 0.00015
    },
    "losses": [
      {
        "id": "section-07-90-l-r-elbow-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 10.0,
        "equivalentLengthFt": 17.5,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-07-tee-through-main-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 2.0,
        "equivalentLengthFt": 21.8,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 8,
    "stream": "CHWS",
    "nominal": 12.0,
    "length": 30.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-12"
    },
    "losses": [
      {
        "id": "section-08-tee-through-main-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 19.9,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-08-14x12-reducer-contraction-1",
        "type": "k",
        "category": "fitting",
        "quantity": 1.0,
        "k": 0.11,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 9,
    "stream": "CHWS",
    "nominal": 12.0,
    "length": 30.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-12"
    },
    "losses": [
      {
        "id": "section-09-tee-through-main-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 19.9,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 10,
    "stream": "CHWS",
    "nominal": 10.0,
    "length": 30.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-10"
    },
    "losses": [
      {
        "id": "section-10-tee-through-main-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 16.7,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-10-12x10-reducer-contraction-1",
        "type": "k",
        "category": "fitting",
        "quantity": 1.0,
        "k": 0.13,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 11,
    "stream": "CHWS",
    "nominal": 8.0,
    "length": 30.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-8"
    },
    "losses": [
      {
        "id": "section-11-tee-through-main-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 13.3,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-11-10x8-reducer-contraction-1",
        "type": "k",
        "category": "fitting",
        "quantity": 1.0,
        "k": 0.15,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 12,
    "stream": "CHWS",
    "nominal": 6.0,
    "length": 30.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-6"
    },
    "losses": [
      {
        "id": "section-12-tee-through-branch-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 30.3,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-12-8x6-reducer-contraction-1",
        "type": "k",
        "category": "fitting",
        "quantity": 1.0,
        "k": 0.18,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 13,
    "stream": "CHWS",
    "nominal": 6.0,
    "length": 25.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-6"
    },
    "losses": [
      {
        "id": "section-13-butterfly-valve-1",
        "type": "equivalent-length",
        "category": "valve",
        "quantity": 1.0,
        "equivalentLengthFt": 22.7,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-13-strainer-1",
        "type": "direct-psi",
        "category": "equipment",
        "quantity": 1.0,
        "pressureLossPsi": 1.0
      },
      {
        "id": "section-13-90-l-r-elbow-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 2.0,
        "equivalentLengthFt": 8.09,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-13-tee-through-main-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 10.1,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 14,
    "stream": "CHWS",
    "nominal": 5.0,
    "length": 20.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-5"
    },
    "losses": [
      {
        "id": "section-14-90-l-r-elbow-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 6.73,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-14-6x5-reducer-contraction-1",
        "type": "k",
        "category": "fitting",
        "quantity": 1.0,
        "k": 0.13,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-14-tee-through-main-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 8.41,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 15,
    "stream": "CHWS",
    "nominal": 5.0,
    "length": 3.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-5"
    },
    "losses": [
      {
        "id": "section-15-tee-through-main-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 8.41,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 16,
    "stream": "CHWS",
    "nominal": 5.0,
    "length": 3.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-5"
    },
    "losses": [
      {
        "id": "section-16-tee-through-branch-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 25.2,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 17,
    "stream": "CHWS",
    "nominal": 3.0,
    "length": 2.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-3"
    },
    "losses": [
      {
        "id": "section-17-butterfly-valve-1",
        "type": "equivalent-length",
        "category": "valve",
        "quantity": 1.0,
        "equivalentLengthFt": 11.5,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-17-cooling-coil-pressure-drop-1",
        "type": "direct-psi",
        "category": "equipment",
        "quantity": 1.0,
        "pressureLossPsi": 7.0
      }
    ]
  },
  {
    "number": 18,
    "stream": "CHWR",
    "nominal": 3.0,
    "length": 4.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-3"
    },
    "losses": [
      {
        "id": "section-18-90-l-r-elbow-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 4.09,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-18-balancing-valve-1",
        "type": "direct-psi",
        "category": "equipment",
        "quantity": 1.0,
        "pressureLossPsi": 1.0
      }
    ]
  },
  {
    "number": 19,
    "stream": "CHWR",
    "nominal": 5.0,
    "length": 3.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-5"
    },
    "losses": [
      {
        "id": "section-19-tee-through-branch-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 25.2,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 20,
    "stream": "CHWR",
    "nominal": 5.0,
    "length": 3.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-5"
    },
    "losses": [
      {
        "id": "section-20-tee-through-main-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 8.41,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 21,
    "stream": "CHWR",
    "nominal": 5.0,
    "length": 20.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-5"
    },
    "losses": [
      {
        "id": "section-21-90-l-r-elbow-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 6.73,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-21-tee-through-main-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 8.41,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-21-6x5-reducer-enlargement-1",
        "type": "k",
        "category": "fitting",
        "quantity": 1.0,
        "k": 0.09,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 22,
    "stream": "CHWR",
    "nominal": 6.0,
    "length": 25.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-6"
    },
    "losses": [
      {
        "id": "section-22-butterfly-valve-1",
        "type": "equivalent-length",
        "category": "valve",
        "quantity": 1.0,
        "equivalentLengthFt": 22.7,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-22-automatic-flow-control-valve-1",
        "type": "direct-psi",
        "category": "equipment",
        "quantity": 1.0,
        "pressureLossPsi": 2.0
      },
      {
        "id": "section-22-control-valve-1",
        "type": "direct-psi",
        "category": "equipment",
        "quantity": 1.0,
        "pressureLossPsi": 5.0
      },
      {
        "id": "section-22-90-l-r-elbow-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 2.0,
        "equivalentLengthFt": 8.09,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 23,
    "stream": "CHWR",
    "nominal": 6.0,
    "length": 30.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-6"
    },
    "losses": [
      {
        "id": "section-23-tee-through-branch-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 30.3,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-23-8x6-reducer-enlargement-1",
        "type": "k",
        "category": "fitting",
        "quantity": 1.0,
        "k": 0.19,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 24,
    "stream": "CHWR",
    "nominal": 8.0,
    "length": 30.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-8"
    },
    "losses": [
      {
        "id": "section-24-tee-through-main-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 13.3,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-24-10x8-reducer-enlargement-1",
        "type": "k",
        "category": "fitting",
        "quantity": 1.0,
        "k": 0.13,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 25,
    "stream": "CHWR",
    "nominal": 10.0,
    "length": 30.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-10"
    },
    "losses": [
      {
        "id": "section-25-tee-through-main-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 16.7,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-25-12x10-reducer-enlargement-1",
        "type": "k",
        "category": "fitting",
        "quantity": 1.0,
        "k": 0.09,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 26,
    "stream": "CHWR",
    "nominal": 12.0,
    "length": 30.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-12"
    },
    "losses": [
      {
        "id": "section-26-tee-through-main-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 19.9,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 27,
    "stream": "CHWR",
    "nominal": 12.0,
    "length": 30.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-12"
    },
    "losses": [
      {
        "id": "section-27-tee-through-main-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 19.9,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 28,
    "stream": "CHWR",
    "nominal": 14.0,
    "length": 150.0,
    "geometry": {
      "kind": "custom",
      "actualInsideDiameterIn": 13.25,
      "roughnessFt": 0.00015
    },
    "losses": [
      {
        "id": "section-28-90-l-r-elbow-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 8.0,
        "equivalentLengthFt": 17.5,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-28-butterfly-valve-1",
        "type": "equivalent-length",
        "category": "valve",
        "quantity": 2.0,
        "equivalentLengthFt": 38.3,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-28-air-separator-1",
        "type": "direct-psi",
        "category": "equipment",
        "quantity": 1.0,
        "pressureLossPsi": 1.0
      }
    ]
  },
  {
    "number": 29,
    "stream": "CHWR",
    "nominal": 14.0,
    "length": 10.0,
    "geometry": {
      "kind": "custom",
      "actualInsideDiameterIn": 13.25,
      "roughnessFt": 0.00015
    },
    "losses": [
      {
        "id": "section-29-tee-through-main-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 21.8,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 30,
    "stream": "CHWR",
    "nominal": 14.0,
    "length": 10.0,
    "geometry": {
      "kind": "custom",
      "actualInsideDiameterIn": 13.25,
      "roughnessFt": 0.00015
    },
    "losses": [
      {
        "id": "section-30-tee-through-branch-1",
        "type": "equivalent-length",
        "category": "fitting",
        "quantity": 1.0,
        "equivalentLengthFt": 65.6,
        "basis": "section-inside-diameter"
      }
    ]
  },
  {
    "number": 31,
    "stream": "CHWR",
    "nominal": 10.0,
    "length": 15.0,
    "geometry": {
      "kind": "catalog",
      "catalogId": "steel-sch40-10"
    },
    "losses": [
      {
        "id": "section-31-butterfly-valve-1",
        "type": "equivalent-length",
        "category": "valve",
        "quantity": 1.0,
        "equivalentLengthFt": 29.2,
        "basis": "section-inside-diameter"
      },
      {
        "id": "section-31-suction-diffuser-1",
        "type": "direct-psi",
        "category": "equipment",
        "quantity": 1.0,
        "pressureLossPsi": 1.0
      }
    ]
  }
] as const;

const makeLoss = (loss: SourceLoss): LossElement => ({ ...loss, applicability: { status: 'unconfirmed', statedEnvelope: envelope } } as LossElement);

const workbookStoredReferenceFlows: Readonly<Record<number, number>> = Object.freeze({
  1: 1800, 2: 1800, 3: 3600, 4: 3600, 5: 1800, 6: 1800, 7: 3600, 8: 3000, 9: 2400, 10: 1800,
  11: 1200, 12: 600, 13: 600, 14: 300, 15: 200, 16: 100, 17: 100, 18: 100, 19: 100, 20: 200,
  21: 300, 22: 600, 23: 600, 24: 1200, 25: 1800, 26: 2400, 27: 3000, 28: 3600, 29: 3600, 30: 1800, 31: 1800,
} as const);

export interface WorkbookReferenceRecord {
  readonly sectionId: string; readonly name: string; readonly stream: 'CHWS' | 'CHWR'; readonly nominalIn: number;
  readonly geometryLabel: string; readonly lengthFt: number; readonly workbookStoredReferenceFlowGpm: number; readonly elements: readonly string[];
}
const referenceLossText = (loss: SourceLoss): string => {
  switch (loss.type) {
    case 'k': return `manual K ${loss.k} × ${loss.quantity}`;
    case 'equivalent-length': return `equivalent length ${loss.equivalentLengthFt} ft × ${loss.quantity}`;
    case 'preset-equivalent-length': return `preset ${loss.presetId} × ${loss.quantity}`;
    case 'cv': return `Cv ${loss.cv} × ${loss.quantity}`;
    case 'direct-psi': return `direct psi ${loss.pressureLossPsi} × ${loss.quantity}`;
    case 'direct-head': return `direct head ${loss.headFtOfSelectedFluid} ft × ${loss.quantity}`;
  }
};
/** Immutable, display-only reference data; never used as engine flow input. */
export const workbookReferenceRecords: readonly WorkbookReferenceRecord[] = Object.freeze(sourceSections.map(({ number, stream, nominal, length, geometry, losses }) => {
  const id = String(number).padStart(2, '0');
  return Object.freeze({ sectionId: `section-${id}`, name: `Section ${id} — ${stream}`, stream, nominalIn: nominal,
    geometryLabel: geometry.kind === 'custom' ? `Custom ID ${geometry.actualInsideDiameterIn} in; roughness ${geometry.roughnessFt} ft` : `Steel Schedule 40 ${nominal} in`,
    lengthFt: length, workbookStoredReferenceFlowGpm: workbookStoredReferenceFlows[number]!, elements: Object.freeze(losses.map(referenceLossText)) });
}));

const workbookStoredFlows: Readonly<Record<number, number>> = Object.freeze({
  1: 1800, 2: 1800, 3: 3600, 4: 3600, 5: 1800, 6: 1800, 7: 3600, 8: 3000, 9: 2400, 10: 1800,
  11: 1200, 12: 600, 13: 600, 14: 600, 15: 300, 16: 100, 17: 100, 18: 100, 19: 100, 20: 200,
  21: 300, 22: 600, 23: 600, 24: 1200, 25: 1800, 26: 2400, 27: 3000, 28: 3600, 29: 3600, 30: 1800, 31: 1800,
});

const referenceRows: readonly WorkbookReferenceRow[] = Object.freeze(sourceSections.map(({ number, stream, nominal, length, geometry, losses }) => Object.freeze({
  sectionId: `Section ${String(number).padStart(2, '0')}`,
  stream,
  traceLabel: `Calc Ex (E.L.) section ${String(number).padStart(2, '0')} input trace`,
  workbookStoredReferenceFlowGpm: workbookStoredFlows[number]!,
  nominalPipeIn: nominal,
  actualLengthFt: length,
  geometry: Object.freeze({ ...geometry }),
  primitives: Object.freeze(losses.map((loss) => Object.freeze({ ...loss }))),
})));

/** Immutable, sanitized metadata for the read-only workbook-reference view. */
export function workbookReferenceRows(): readonly WorkbookReferenceRow[] { return referenceRows; }

export const provisional100GpmPathSectionIds = Object.freeze(Array.from({ length: 25 }, (_, index) => `section-${String(index + 7).padStart(2, '0')}`));

/** Returns a new, unaccepted input-reference project on each invocation. */
export function workbookExampleInputReference(): HydronicProject {
  const nodes = sourceSections.flatMap(({ number }) => {
    const id = String(number).padStart(2, '0');
    return [{ id: `reference-${id}-from`, name: `Section ${id} source` }, { id: `reference-${id}-to`, name: `Section ${id} destination` }];
  });
  const sections: readonly Section[] = sourceSections.map(({ number, stream, nominal, length, geometry, losses }) => {
    const id = String(number).padStart(2, '0');
    return {
      id: `section-${id}`,
      name: `Section ${id} — ${stream}`,
      description: `Input-reference trace: ${nominal}-in steel pipe; no portable topology.`,
      role: stream === 'CHWS' ? 'supply' : 'return',
      fromNodeId: `reference-${id}-from`,
      toNodeId: `reference-${id}-to`,
      actualLengthFt: length,
      geometry: { ...geometry },
      elements: losses.map(makeLoss),
    };
  });
  return {
    schema: HYDRONIC_PRESSURE_DROP_SCHEMA,
    id: 'workbook-example-input-reference',
    name: 'Workbook example input reference',
    calculationDataVersion: HYDRONIC_REFERENCE_DATA_VERSION,
    provenance: [{
      sourceId: 'legacy-workbook-input-transcription',
      locator: 'Calc Ex (E.L.) input rows 13–104',
      note: 'Input-only transcription. Legacy formulas, calculated results, portable topology, and client metadata are intentionally omitted.',
    }],
    systems: [{
      id: 'legacy-equivalent-length-input-trace',
      name: 'Legacy equivalent-length input trace',
      fluidReferenceId: 'iapws-liquid-water-sr6-08-2011',
      meanTemperatureF: 49,
      pumpDischargeNodeId: nodes[0]!.id,
      pumpSuctionNodeId: nodes[1]!.id,
      nodes,
      sections,
      circuits: [],
      margin: { percent: 0, categories: [], acknowledged: false },
    }],
  };
}


/**
 * A deliberately limited topology reconstruction of the one depicted 100-GPM coil path.
 * It is not a reconstruction of the workbook's complete network or any workbook result.
 */
export function workbookExampleProvisional100GpmPath(): HydronicProject {
  const base = workbookExampleInputReference();
  const original = base.systems[0]!;
  const pathIds = provisional100GpmPathSectionIds;
  const pathIndex = new Map(pathIds.map((id, index) => [id, index]));
  const retainedNodes = original.nodes.filter((node) => /^reference-0[1-6]-(from|to)$/.test(node.id));
  const pathNodes = Array.from({ length: pathIds.length + 1 }, (_, index) => ({ id: `provisional-path-node-${String(index).padStart(2, '0')}`, name: `Provisional path node ${String(index).padStart(2, '0')}` }));
  const sections = original.sections.map((section) => {
    const index = pathIndex.get(section.id);
    if (index === undefined) return section;
    return {
      ...section,
      role: index < 10 ? 'supply' : index === 10 ? 'terminal' : 'return',
      fromNodeId: pathNodes[index]!.id,
      toNodeId: pathNodes[index + 1]!.id,
    } as Section;
  });
  const circuit = {
    id: 'provisional-selected-100-gpm-path',
    name: 'Provisional selected 100 GPM path',
    state: 'active' as const,
    terminalDesignGpm: 100,
    supplySectionIds: pathIds.slice(0, 10),
    terminalSectionId: pathIds[10]!,
    returnSectionIds: pathIds.slice(11),
  };
  return {
    ...base,
    id: 'workbook-example-provisional-100-gpm-path',
    name: 'Workbook example provisional 100 GPM path',
    provenance: [...base.provenance, { sourceId: 'partial-topology-inference', locator: 'selected 100 GPM path sections 07–31', note: 'Partial inferred reconstruction only; not legacy-equivalent or accepted.' }],
    systems: [{
      ...original,
      id: 'legacy-provisional-100-gpm-path',
      name: 'Provisional selected 100 GPM path',
      pumpDischargeNodeId: pathNodes[0]!.id,
      pumpSuctionNodeId: pathNodes[pathNodes.length - 1]!.id,
      nodes: [...retainedNodes, ...pathNodes],
      sections,
      circuits: [circuit],
      margin: { percent: 0, categories: [], acknowledged: false },
    }],
  };
}
