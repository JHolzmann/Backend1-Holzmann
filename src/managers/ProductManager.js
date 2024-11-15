import paths from "../utils/paths.js";
import { readJsonFile, writeJsonFile, deleteFile } from "../utils/fileHandler.js";
import { generateId } from "../utils/collectionHandler.js";
import { convertToBoolean } from "../utils/converter.js";
import ErrorManager from "./ErrorManager.js";

export default class ProductManager {
    #jsonFilename;
    #product;

    constructor() {
        this.#jsonFilename = "products.json";
    }

    // Busca un ingrediente por su ID
    async #findOneById(id) {
        this.#product = await this.getAll();
        const productFound = this.#product.find((item) => item.id === Number(id));

        if (!productFound) {
            throw new ErrorManager("ID no encontrado", 404);
        }

        return productFound;
    }

    // Obtiene una lista de ingredientes
    async getAll() {
        try {
            this.#product = await readJsonFile(paths.files, this.#jsonFilename);
            return this.#product;
        } catch (error) {
            throw new ErrorManager(error.message, error.code);
        }
    }

    // Obtiene un ingrediente específico por su ID
    async getOneById(id) {
        try {
            const productFound = await this.#findOneById(id);
            return productFound;
        } catch (error) {
            throw new ErrorManager(error.message, error.code);
        }
    }

    // Inserta un ingrediente
    async insertOne(data, file) {
        try {
            const { title, status, stock } = data;

            if (!title || !status || !stock ) {
                throw new ErrorManager("Faltan datos obligatorios", 400);
            }

            if (!file?.filename) {
                throw new ErrorManager("Falta el archivo de la imagen", 400);
            }

            const product = {
                id: generateId(await this.getAll()),
                title,
                status: convertToBoolean(status),
                stock: Number(stock),
                thumbnail: file?.filename,
            };

            this.#product.push(product);
            await writeJsonFile(paths.files, this.#jsonFilename, this.#product);

            return product;
        } catch (error) {
            if (file?.filename) await deleteFile(paths.images, file.filename); // Elimina la imagen si ocurre un error
            throw new ErrorManager(error.message, error.code);
        }
    }

    // Actualiza un ingrediente en específico
    async updateOneById(id, data, file) {
        try {
            const { title, status, stock } = data;
            const productFound = await this.#findOneById(id);
            const newThumbnail = file?.filename;

            const product = {
                id: productFound.id,
                title: title || productFound.title,
                status: status ? convertToBoolean(status) : productFound.status,
                stock: stock ? Number(stock) : productFound.stock,
                thumbnail: newThumbnail || productFound.thumbnail,
            };

            const index = this.#product.findIndex((item) => item.id === Number(id));
            this.#product[index] = product;
            await writeJsonFile(paths.files, this.#jsonFilename, this.#product);

            // Elimina la imagen anterior si es distinta de la nueva
            if (file?.filename && newThumbnail !== productFound.thumbnail) {
                await deleteFile(paths.images, productFound.thumbnail);
            }

            return product;
        } catch (error) {
            if (file?.filename) await deleteFile(paths.images, file.filename); // Elimina la imagen si ocurre un error
            throw new ErrorManager(error.message, error.code);
        }
    }

    // Elimina un ingrediente en específico
    async deleteOneById (id) {
        try {
            const productFound = await this.#findOneById(id);

            // Si tiene thumbnail definido, entonces, elimina la imagen del ingrediente
            if (productFound.thumbnail) {
                await deleteFile(paths.images, productFound.thumbnail);
            }

            const index = this.#product.findIndex((item) => item.id === Number(id));
            this.#product.splice(index, 1);
            await writeJsonFile(paths.files, this.#jsonFilename, this.#product);
        } catch (error) {
            throw new ErrorManager(error.message, error.code);
        }
    }
}