import verbFormsJson from "../../data/verb-forms.json";

export type VerbForm = {
  form: string;
  kana: string;
  label: string;
  labelFr: string;
  meaning: string;
  meaningFr: string;
};

export type VerbGroup = {
  id: string;
  verb: string;
  kana: string;
  pattern: string;
  patternFr: string;
  example: string;
  forms: VerbForm[];
};

export function getVerbForms(): VerbGroup[] {
  return verbFormsJson as VerbGroup[];
}

function normalize(value: string): string {
  return value.normalize("NFKC").toLowerCase();
}

export function filterVerbGroups(groups: VerbGroup[], query: string): VerbGroup[] {
  const needle = normalize(query.trim());
  if (!needle) return groups;

  return groups.filter((group) => {
    const fields = [
      group.verb,
      group.kana,
      group.pattern,
      group.patternFr,
      group.example,
      ...group.forms.flatMap((form) => [
        form.form,
        form.kana,
        form.label,
        form.labelFr,
        form.meaning,
        form.meaningFr,
      ]),
    ];
    return fields.some((field) => normalize(field).includes(needle));
  });
}
