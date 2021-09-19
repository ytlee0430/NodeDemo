module.exports = (sequelize, DataTypes) => { return sequelize.define('users', {
  acct: {
    type: DataTypes.STRING(32),
    allowNull: false,
    primaryKey: true
  },
  pwd: {
    type: DataTypes.STRING(32),
    allowNull: false
  },
  fullname: {
    type: DataTypes.STRING(32),
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'users',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: 'users_pkey',
      unique: true,
      fields: [
        { name: 'acct' }
      ]
    }
  ]
})
}
