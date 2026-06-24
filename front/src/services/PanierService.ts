import { inject } from "@angular/core";
import { ETypeObjetProposer } from "@enums/ETypeObjetProposer";
import { Logistique } from "@models/Logistique";
import { Materiel } from "@models/Materiel";
import { Panier } from "@models/Panier";
import { SnackBarService } from "./SnackBarService";

export class PanierService
{
    private readonly CLE_LOCAL_STORAGE = "panier";

    private snackBarServ = inject(SnackBarService);

    Lister(): Panier[]
    {
        if(localStorage.getItem(this.CLE_LOCAL_STORAGE))
            return JSON.parse(localStorage.getItem(this.CLE_LOCAL_STORAGE)) as Panier[];

        return [];
    }

    Ajouter(_objet: Materiel | Logistique, _quantite: number): void
    {
        let obj: Panier = {
            idType: _objet.id,
            type: _objet.kind == "Materiel" ? ETypeObjetProposer.Materiel : ETypeObjetProposer.Logistique,
            nom: _objet.nom,
            quantite: _quantite,
            prixUnitaire: _objet.prix
        };

        let liste: Panier[] = [];
        
        if(localStorage.getItem(this.CLE_LOCAL_STORAGE))
        {
            liste = JSON.parse(localStorage.getItem(this.CLE_LOCAL_STORAGE)) as Panier[];

            const INDEX = liste.findIndex(x => x.idType == obj.idType && x.type == obj.type);

            if(INDEX != -1)
            {
                liste[INDEX].quantite = obj.quantite;
                this.snackBarServ.Ok(`La quantité de ${obj.nom} a été modifiée`);
            }
            else
            {
                liste.push(obj);
                this.snackBarServ.Ok(`${obj.nom} à été ajouté au panier`);
            }
        }
        else
        {
            liste.push(obj);
            this.snackBarServ.Ok(`${obj.nom} à été ajouté au panier`);
        }

        localStorage.setItem(this.CLE_LOCAL_STORAGE, JSON.stringify(liste));
    }

    Modifier(_objet: Panier, _quantite: number): void
    {
        if(!localStorage.getItem(this.CLE_LOCAL_STORAGE))
            return;

        let liste = JSON.parse(localStorage.getItem(this.CLE_LOCAL_STORAGE)) as Panier[];

        let element = liste.find(x => x.idType == _objet.idType && x.type == _objet.type);

        if(element)
            element.quantite = _quantite;
        
        localStorage.setItem(this.CLE_LOCAL_STORAGE, JSON.stringify(liste));

        this.snackBarServ.Ok(`${element.nom} a été modifié`);
    }

    Supprimer(_objet: Panier): boolean
    {
        if(!localStorage.getItem(this.CLE_LOCAL_STORAGE))
            return false;

        let liste = JSON.parse(localStorage.getItem(this.CLE_LOCAL_STORAGE)) as Panier[];

        liste = liste.filter(x => !(x.idType == _objet.idType && x.type == _objet.type));

        if(liste.length == 0)
            localStorage.removeItem(this.CLE_LOCAL_STORAGE);

        else
            localStorage.setItem(this.CLE_LOCAL_STORAGE, JSON.stringify(liste));

        this.snackBarServ.Ok(`${_objet.nom} a été supprimé du panier`);

        return true;
    }

    Vider(): void
    {
        localStorage.removeItem(this.CLE_LOCAL_STORAGE);
    }
}