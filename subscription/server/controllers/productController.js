const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Authenticated
exports.getProducts = async (req, res) => {
  try {
    const { category, type, search, activeOnly } = req.query;
    const filter = {};

    if (activeOnly === 'true' || req.user.role === 'customer') {
      filter.isActive = true;
    } else if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    if (category) filter.category = category;
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Authenticated
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Admin, Staff
exports.createProduct = async (req, res) => {
  try {
    const { name, code, type, salesPrice, costPrice, description, category, variants, isActive } = req.body;

    if (!name || salesPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product name and sales price are required',
      });
    }

    const product = await Product.create({
      name,
      code: code ? code.toUpperCase() : `PRD-${Date.now().toString().slice(-4)}`,
      type: type || 'service',
      salesPrice: Number(salesPrice),
      costPrice: Number(costPrice || 0),
      description: description || '',
      category: category || 'General',
      variants: variants || [],
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Admin, Staff
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product (or soft delete)
// @route   DELETE /api/products/:id
// @access  Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

