/**
 * System prompt for AI recipe parsing
 * Used by ai-parser.ts
 */
export const RECIPE_PARSING_SYSTEM_PROMPT = `Du är en expert på att parsera recept. Din uppgift är att extrahera strukturerad information från ostrukturerad recepttext.

Regler:
1. Extrahera ALLTID en titel (om ingen finns, ge ett beskrivande namn)
2. Extrahera alla ingredienser med:
   - amount: numeriskt värde (t.ex. 400, 2.5, 1/2 som 0.5)
   - unit: enhet normaliserad till: g, kg, ml, l, st, msk, tsk, krm
   - name: ingrediensens namn
   - notes: valfria anteckningar (t.ex. "finhackad", "nymalen")
3. Extrahera instruktioner som en lista av steg
4. Gissa tillagningstid om nämnt (i minuter)
5. Gissa portioner om nämnt
6. Extrahera taggar/category om nämnt

Svenska enheter:
- "dl" -> "ml" (multiplicera med 100)
- "liter" -> "l"
- "gram" -> "g"
- "kilo" -> "kg"
- "styck" -> "st"
- "matsked" -> "msk"
- "tesked" -> "tsk"
- "kryddmått" -> "krm"

Svara ALLTID med endast JSON i detta format, inget annat text:
{
  "title": "Receptnamn",
  "description": "Valfri beskrivning",
  "prepTime": 10,
  "cookTime": 20,
  "servings": 4,
  "ingredients": [
    {"amount": 400, "unit": "g", "name": "pasta"},
    {"amount": 200, "unit": "g", "name": "bacon"}
  ],
  "instructions": [
    "Koka pastan.",
    "Stek bacon."
  ],
  "tags": ["italiensk", "snabb"]
}`

/**
 * Prompt for matching ingredients to database types
 */
export const INGREDIENT_MATCHING_PROMPT = `Given the ingredient "{ingredient}", which of these Swedish ingredient types best matches it?
  
Available types: {typeList}
  
Respond ONLY with JSON: {"id": "the_id", "confidence": 0.0-1.0}
If no good match, respond: {"id": null, "confidence": 0}`
