<?php

namespace Drupal\decreto_content_modify\Utils;

use Drupal\node\Entity\Node;

class DecretoContentModifyUtils {

  /**
   * Helper function to reduce repetition of common queries.
   * Performs a smart entityQuery using the sourceNode and extracts the node of $relatedNodeType.
   *
   * @param Node $sourceNode
   * @param $relatedNodeType
   * @param bool $load
   * @return \Drupal\Core\Entity\EntityInterface|mixed|null|static
   */
  public static function getRelatedNodes(Node $sourceNode, $relatedNodeType, $load = TRUE) {
    if ($sourceNode->getType() == 'decreto_bullet_point') {
      if ($relatedNodeType == 'decreto_meeting') {
        $query = \Drupal::entityQuery('node')
          ->condition('type', 'decreto_meeting')
          ->condition('field_decreto_meet_bps', $sourceNode->id());

        $nids = $query->execute();
        if (!empty($nids)) {
          $nid = reset($nids);
          return ($load) ? Node::load($nid) : $nid;
        }
      }
    }
    elseif ($sourceNode->getType() == 'decreto_bullet_point_attachment') {
      if ($relatedNodeType == 'decreto_meeting') {
        $bp = self::getRelatedNodes($sourceNode, 'decreto_bullet_point');
        $meeting_nid = self::getRelatedNodes($bp, 'decreto_meeting', FALSE);

        return ($load) ? Node::load($meeting_nid) : $meeting_nid;
      }
      elseif ($relatedNodeType == 'decreto_bullet_point') {
        $query = \Drupal::entityQuery('node')
          ->condition('type', 'decreto_bullet_point')
          ->condition('field_decreto_bp_bpas', $sourceNode->id());

        $nids = $query->execute();
        if (!empty($nids)) {
          $nid = reset($nids);
          return ($load) ? Node::load($nid) : $nid;
        }
      }

    }

    return NULL;
  }
}
 