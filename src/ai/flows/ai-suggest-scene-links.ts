'use server';

/**
 * @fileOverview An AI agent that suggests optimal connections between scenes in a tour.
 *
 * - suggestSceneLinks - A function that handles the scene link suggestion process.
 * - SuggestSceneLinksInput - The input type for the suggestSceneLinks function.
 * - SuggestSceneLinksOutput - The return type for the suggestSceneLinks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSceneLinksInputSchema = z.object({
  scenes: z.array(
    z.object({
      id: z.string().describe('The unique identifier of the scene.'),
      description: z.string().describe('A text description of the scene.'),
      imageDataUri: z
        .string()
        .describe(
          "A photo of the scene, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
    })
  ).describe('An array of scenes in the tour.'),
});
export type SuggestSceneLinksInput = z.infer<typeof SuggestSceneLinksInputSchema>;

const SuggestSceneLinksOutputSchema = z.array(
  z.object({
    sourceSceneId: z.string().describe('The ID of the scene to link from.'),
    targetSceneId: z.string().describe('The ID of the scene to link to.'),
    reason: z.string().describe("The AI's reasoning for suggesting this link."),
  })
).describe('An array of suggested scene links.');
export type SuggestSceneLinksOutput = z.infer<typeof SuggestSceneLinksOutputSchema>;

export async function suggestSceneLinks(input: SuggestSceneLinksInput): Promise<SuggestSceneLinksOutput> {
  return suggestSceneLinksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSceneLinksPrompt',
  input: {schema: SuggestSceneLinksInputSchema},
  output: {schema: SuggestSceneLinksOutputSchema},
  prompt: `You are an AI assistant that suggests connections between scenes in a virtual tour.

  Analyze the following scenes and suggest which scenes should be linked together via hotspots, and the reason for linking them.
  The goal is to create a smooth and intuitive navigation experience for the user.

  Here are the scenes:
  {{#each scenes}}
  Scene ID: {{this.id}}
  Description: {{this.description}}
  Image: {{media url=this.imageDataUri}}
  {{/each}}

  Your response should be a JSON array of objects, where each object has a sourceSceneId, a targetSceneId, and a reason field.
`,
});

const suggestSceneLinksFlow = ai.defineFlow(
  {
    name: 'suggestSceneLinksFlow',
    inputSchema: SuggestSceneLinksInputSchema,
    outputSchema: SuggestSceneLinksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
