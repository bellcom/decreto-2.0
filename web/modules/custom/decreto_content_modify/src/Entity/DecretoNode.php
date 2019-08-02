<?php

namespace Drupal\decreto_content_modify\Entity;

use Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException;
use Drupal\node\NodeInterface;

/**
 * Abstract wrapper for Decreto Nodes.
 *
 * Allows to perform commonly used procedures in a more efficient way.
 */
abstract class DecretoNode {
  protected $entity;

  /**
   * DecretoNode constructor.
   *
   * @param \Drupal\node\NodeInterface $entity
   *   Memo node.
   *
   * @throws \Drupal\Core\Entity\Exception\UnsupportedEntityTypeDefinitionException
   */
  public function __construct(NodeInterface $entity) {
    if ($entity->getType() == $this->getEntityType()) {
      $this->entity = $entity;
    }
    else {
      throw new UnsupportedEntityTypeDefinitionException(sprintf('Expected entity of type "%s", "%s" given', $this->getEntityType(), $entity->getType()));
    }
  }

  /**
   * Returns original node entity.
   *
   * @return \Drupal\node\NodeInterface
   *   Memo node.
   */
  public function getEntity() {
    return $this->entity;
  }

  /**
   * Return original entity expected type.
   *
   * @return string
   *   Original entity expected type.
   */
  abstract public function getEntityType();

}
