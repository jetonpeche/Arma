export type Grade =
{
    id: number,
    nom: string,
    urlFichierIcone: string | null,
    fonction: string | null,
    ordre: number,
    nbPlace: number,
    nbOperationRequis: number,
    nbPointBoutiqueGagnerParOperation: number,
    conserne: number,
    candidatureRequise: boolean,
    estHonorifique: boolean
}

export type GradeLeger =
{
    id: number,
    nom: string
}

export type GradeRequete = Omit<Grade, "id"|"nomFichier">;