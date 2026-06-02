const z = require('zod');

const typeDocumentEnum = z.enum([
  'attestation_travail',
  'attestation_salaire',
  'fiche_paie',
  'certificat_travail',
]);

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Identifiant de demande invalide');

const createDemandeDocumentSchema = z.object({
  body: z.object({
    typeDocument: typeDocumentEnum,
    description: z.string().optional(),
  }),
});

const updateStatutDemandeDocumentSchema = z.object({
  body: z.object({
    status: z.enum(['en_attente', 'acceptee', 'refusee']),
    commentaireAdmin: z.string().optional(),
  }),
});

const demandeDocumentParamsSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

module.exports = {
  createDemandeDocumentSchema,
  updateStatutDemandeDocumentSchema,
  demandeDocumentParamsSchema,
};
