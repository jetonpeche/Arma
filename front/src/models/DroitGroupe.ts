export type DroitGroupe = 
{
    id: number,
    nom: string,
    peutAcheterLogistiqueMateriel: boolean,
    peutAcheterVaisseau: boolean,
    listeDroit: Droit[]
}

export type Droit =
{
    routeGroupe: string,
    peutLire: boolean,
    peutEcrire: boolean,
    peutSupprimer: boolean
}