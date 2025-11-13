class UserTag < ApplicationRecord
  belongs_to :tag
  validates :user_id, presence: true
  validates :tag_id, presence: true, uniqueness: { scope: :user_id }
end
