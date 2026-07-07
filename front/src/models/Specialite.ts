export type Specialite =
{
    id: number,
    idParents: number[],
    nom: string,
    raccourci: string,
    categorie?: string,
    grade: {
        id: number,
        nom: string,
        nbOperationRequis: number
    }
    description: string,
    estNavy: boolean,
    urlImage: string
}

export type SpecialiteLeger = Omit<Specialite, "description">;

export type SpecialiteRequete = Omit<Specialite, "id">;