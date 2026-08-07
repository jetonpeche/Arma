import { GradeLeger } from "./Grade"
import { PersonnageLeger } from "./Personnage"

export type Orbat =
{
    id: number,
    idParent: number | null,
    titre: string,
    indicatif: string | null,
    frequenceRadio: string | null,
    urlImage: string,
    listeSlot: OrbatSlot[]
}

export type OrbatSlot =
{
    id: number,
    gradeRequis: GradeLeger | null,
    personnage: PersonnageLeger | null,
    role: string,
    ordreAffichage: number,
    estOptionnel: boolean
}