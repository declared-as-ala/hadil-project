const Employe = require('../models/Employe.model');
const ApiError = require('../utils/ApiError');

class EmployeService {
  async getAllEmployes(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.departement) query.departement = filters.departement;

    const employes = await Employe.find(query)
      .populate('utilisateur', 'nom prenom email adresse role')
      .populate('stagiairesEncadres', 'sujetDeStage status');

    return employes;
  }

  async getEmployeById(id) {
    const employe = await Employe.findById(id)
      .populate('utilisateur', 'nom prenom email adresse role')
      .populate('encadrant', 'poste departement');

    if (!employe) {
      throw new ApiError(404, 'Employe not found');
    }
    return employe;
  }

  async createEmploye(data) {
    const existing = await Employe.findOne({ utilisateur: data.utilisateurId });
    if (existing) {
      throw new ApiError(409, 'This user is already registered as an employee');
    }

    const employe = new Employe({
      utilisateur: data.utilisateurId,
      poste: data.poste,
      departement: data.departement,
      dateEmbauche: data.dateEmbauche,
      telephone: data.telephone,
      status: data.status || 'actif',
    });

    await employe.save();

    return Employe.findById(employe._id).populate('utilisateur', 'nom prenom email adresse role');
  }

  async updateEmploye(id, data) {
    if (data.utilisateurId) {
      data.utilisateur = data.utilisateurId;
      delete data.utilisateurId;
    }
    const employe = await Employe.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate('utilisateur', 'nom prenom email adresse role');

    if (!employe) {
      throw new ApiError(404, 'Employe not found');
    }
    return employe;
  }

  async deleteEmploye(id) {
    const employe = await Employe.findByIdAndDelete(id);
    if (!employe) {
      throw new ApiError(404, 'Employe not found');
    }
    return { message: 'Employe deleted successfully' };
  }
}

module.exports = new EmployeService();
