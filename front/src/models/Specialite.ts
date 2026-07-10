export type Specialite =
{
    id: number,
    idParents: number[],
    nom: string,
    raccourci: string,
    categorie: string,
    grade: {
        id: number,
        nom: string,
        nbOperationRequis: number
    }
    description: string,
    estNavy: boolean,
    urlImage: string
}

export type SpecialiteLeger = 
{
    id: number,
    nom: string
}

export type SpecialiteRequete =
{
    idParents: number[],
    nom: string,
    raccourci: string,
    categorie?: string,
    idGrade: number,
    description: string
}