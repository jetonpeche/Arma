export type PersonnageDroitGroupe = 
{
    id: number,
    idDroitGroupe: number | null,
    nom: string
}

export type PersonnageDroitGroupeRequete = 
{
    idPersonnage: number,
    idDroitGroupe: number | null
}