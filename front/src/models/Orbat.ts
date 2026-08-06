import { PersonnageLeger } from "./Personnage"

export type Orbat =
{
    id: number,
    idParent: number,
    titre: string,
    indicatif: string | null,
    frequenceRadio: string | null,
    urlImage: string,
    listeSlot: OrbatSlot[]
}

export type OrbatSlot =
{
    id: number,
    gradeRequis: string | null,
    personnage: PersonnageLeger | null,
    role: string,
    ordreAffichage: number
}