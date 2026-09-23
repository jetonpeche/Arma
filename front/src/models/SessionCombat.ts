import { EModeVisibilite } from "@enums/EModeVisibilite"
import { ETypeRevelation } from "@enums/ETypeRevelation"

export type SessionCombat = 
{
    nomPartie: string,
    urlImagecarte: string,
    hauteur: number, 
    largeur: number,
    listePion: SessionCombatPion[],
    listeDecor: SessionCombatDecor[],
    bibliothequeDecor: SessionCombatBibliotheque[]
}

export type SessionCombatPion =
{
    idPion: string,
    idVaisseau: number,
    idUtilisateurAssigner: number | null,
    positionX: number,
    positionY: number,
    rotationDegres: number,
    visibiliteMode: EModeVisibilite,
    listeIdUtilisateurAutoriser: number[],
    revelationType: ETypeRevelation
}

export type SessionCombatDecor =
{
    idDecor: string,
    idBibliothequeDecor: number,
    positionX: number,
    positionY: number,
    rotationDegres: number,
    echelle: number,
    ordreCalque: number,
    visibiliteMode: EModeVisibilite,
    listeIdUtilisateurAutoriser: number[]
}

export type SessionCombatBibliotheque =
{
    id: number,
    nomRecherche: string | null,
    urlImage: string
}

export type ModifierFondTransformRequete =
{
    hauteur: number,
    largeur: number
}
