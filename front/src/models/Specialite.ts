export type Specialite =
{
    id: number,
    nom: string,
    description: string,
    estNavy: boolean
}

export type SpecialiteLeger = Omit<Specialite, "description">;

export type SpecialiteRequete = Omit<Specialite, "id">;