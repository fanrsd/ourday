import type { ComponentType } from "react";
import type { TemplateId } from "./registry.ts";
import type { TemplateProps } from "./props.ts";
import Klasik from "./klasik.tsx";
import Modern from "./modern.tsx";
import Botani from "./botani.tsx";
import Senja from "./senja.tsx";
import Monokrom from "./monokrom.tsx";
import { makeAdat } from "./adat/adat.tsx";

/**
 * The catalogue's other half: registry.ts says what exists, this says what
 * renders it. Adding a design is one entry in each — there is no page builder
 * and no configuration, so a design can be as opinionated as it needs to be.
 *
 * Keyed by TemplateId rather than looked up by string, so a missing template is
 * a type error at author time instead of a blank page on a wedding day.
 */
export const TEMPLATE_COMPONENTS: Record<TemplateId, ComponentType<TemplateProps>> = {
  klasik: Klasik,
  modern: Modern,
  botani: Botani,
  senja: Senja,
  monokrom: Monokrom,

  // Eight cultures, one component: makeAdat closes over the pack so the
  // template id never has to enter TemplateProps. Record<TemplateId, …> means
  // forgetting one is a compile error, not a blank page on a wedding day.
  "adat-jawa": makeAdat("jawa"),
  "adat-sunda": makeAdat("sunda"),
  "adat-minang": makeAdat("minang"),
  "adat-batak": makeAdat("batak"),
  "adat-bali": makeAdat("bali"),
  "adat-tionghoa": makeAdat("tionghoa"),
  "adat-bugis": makeAdat("bugis"),
  "adat-melayu": makeAdat("melayu"),
};

export type { TemplateProps } from "./props.ts";
