const Contact = require("../models/Contact");

const getAllContacts = (req, res, next) => {
    Contact.find()
        .then((contacts) => {
            res.status(200).json({
                success: true,
                message: "All contacts retrieved successfully",
                data: contacts,
            });
        })
        .catch((error) => {
            res.status(500).json({ message: "Error retrieving contacts", error });
        });
};

const createContact = (req, res, next) => {
    let contact = {
        ...req.body,
    };
    console.log("req.body:", req.body);
    Contact.create(contact)
        .then((createdContact) => {
            res.status(201).json({
                message: "Contact created successfully",
                contact: createdContact,
            });
        })
        .catch((error) => {
            console.log(error);
            res.status(500).json({
                message: "Error creating contact",
                error: error.message,
            });
        });
};


const deleteAllContacts = (req, res, next) => {
    Contact.deleteMany()
        .then((status) => {
            res
                .status(200)
                .json({ message: "All Contacts deleted successfully", status });
        })
        .catch((error) => {
            res.status(500).json({ message: "Error deleting all contacts", error });
        });
};

const getContactById = (req, res, next) => {
    Contact.findById(req.params.contact_id)
        // .populate("category")
        .then((contact) => {
            if (!contact) {
                return res.status(404).json({ message: "Contact not found" });
            }
            res.json({
                success: true,
                message: "Contact retrieved successfully",
                data: contact,
            });
        })
        .catch((error) => {
            res.status(500).json({ message: "Error retrieving contact", error });
        });
};


const deleteContactById = (req, res, next) => {
    Contact.findByIdAndDelete(req.params.contact_id, req.body)
        .then((contact) => {
            if (contact) {
                res.json({ message: "Contact item deleted successfully" });
            } else {
                res.status(404).json({ message: "Contact item not found" });
            }
        })
        .catch((error) => {
            res.status(500).json({ message: "Error deleting contact item", error });
        });
};

module.exports = {
    getAllContacts,
    createContact,
    deleteAllContacts,
    getContactById,
    deleteContactById,
};
