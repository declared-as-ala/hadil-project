const Poste = require('../models/Poste.model');
const ApiError = require('../utils/ApiError');

class PosteService {
  async getAllPostes() {
    return Poste.find().sort({ nom_poste: 1 });
  }

  async getPosteById(id) {
    const poste = await Poste.findById(id);
    if (!poste) throw new ApiError(404, 'Poste introuvable.');
    return poste;
  }

  async createPoste(data) {
    const poste = new Poste({
      nom_poste: data.nom_poste,
      salaire_base: data.salaire_base,
      prix_heure_sup: data.prix_heure_sup,
    });
    await poste.save();
    return poste;
  }

  async updatePoste(id, data) {
    const poste = await Poste.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!poste) throw new ApiError(404, 'Poste introuvable.');
    return poste;
  }

  async deletePoste(id) {
    const poste = await Poste.findByIdAndDelete(id);
    if (!poste) throw new ApiError(404, 'Poste introuvable.');
    return { message: 'Poste supprimé avec succès.' };
  }
}

module.exports = new PosteService();
