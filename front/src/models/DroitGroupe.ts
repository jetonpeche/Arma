export type DroitGroupe = 
{
    id: number,
    nom: string,
    peutProposerLogistiqueMateriel: boolean,
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

export type DroitGroupeRequete = Omit<DroitGroupe, "id">;