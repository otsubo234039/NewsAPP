class User < ApplicationRecord
  has_secure_password

  has_many :user_categories, dependent: :destroy
  has_many :categories, through: :user_categories

  validates :name, presence: true, uniqueness: true
  validates :email, uniqueness: true, allow_blank: true
end
