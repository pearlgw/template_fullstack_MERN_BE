import Users from "../model/UserModel.js";
import argon2 from "argon2";

export const getUsers = async (req, res) => {
  try {
    const response = await Users.findAll({
      attributes: ["uuid", "name", "email", "role"],
    });
    res.status(200).json({ data: response });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const response = await Users.findOne({
      attributes: ["uuid", "name", "email", "role"],
      where: {
        uuid: req.params.id,
      },
    });
    res.status(200).json({ data: response });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createUser = async (req, res) => {
  const { name, email, password, confPassword, role } = req.body;
  if (password !== confPassword)
    return res
      .status(400)
      .json({ msg: "Password dan Confirmation Password tidak cocok" });

  const existingUser = await Users.findOne({
    where: {
      email: email,
    },
  });
  if (existingUser)
    return res.status(400).json({ msg: "Email sudah terdaftar" });

  const hashPassword = await argon2.hash(password);
  try {
    const user = await Users.create({
      name: name,
      email: email,
      password: hashPassword,
      role: role,
    });

    const response = {
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    res.status(201).json({ data: response, msg: "Register Berhasil" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

export const updateUser = async (req, res) => {
  const user = await Users.findOne({
    where: {
      uuid: req.params.id,
    },
  });
  if (!user) {
    return res.status(404).json({ msg: "User tidak ditemukan" });
  }

  const { name, email, password, confPassword, role } = req.body;
  let hashPassword;

  if (password && password === confPassword) {
    hashPassword = await argon2.hash(password);
  } else if (!password) {
    hashPassword = user.password;
  } else {
    return res
      .status(400)
      .json({ msg: "Password dan Confirmation Password tidak cocok" });
  }

  try {
    await Users.update(
      {
        name: name,
        email: email,
        password: hashPassword,
        role: role,
      },
      {
        where: { uuid: req.params.id },
      }
    );

    // Ambil data user terbaru setelah update
    const updatedUser = await Users.findOne({
      where: { uuid: req.params.id },
      attributes: ["uuid", "name", "email", "role"],
    });

    res.status(200).json({ data: updatedUser, msg: "Data berhasil diupdate" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const user = await Users.findOne({
    where: {
      uuid: req.params.id,
    },
  });
  if (!user) {
    return res.status(404).json({ msg: "User tidak ditemukan" });
  }
  try {
    await Users.destroy({
        where:{
            id: user.id
        }
    });
    res.status(200).json({ msg: "Data berhasil dihapus" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};
