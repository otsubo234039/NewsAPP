class User < ApplicationRecord
  has_secure_password

  has_many :user_categories, dependent: :destroy
  has_many :categories, through: :user_categories

  validates :email, presence: true, uniqueness: true
  validates :name, presence: true
end
