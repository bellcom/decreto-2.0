<?php

namespace Drupal\decreto_content_modify\Form;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\decreto_content_modify\Entity\DecretoBulletPoint;
use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;

/**
 * Implements the ReferatEditForm form.
 *
 * @see \Drupal\Core\Form\FormBase
 */
class ReferatEditForm extends BulletPointAttachmentBaseEditForm {

  /**
   * Bullet point node.
   *
   * @var \Drupal\node\NodeInterface
   */
  protected $bulletPoint;

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'decreto-content-modify-referat-edit-form';
  }

  /**
   * Returns the title for the form.
   *
   * @return \Drupal\Core\StringTranslation\TranslatableMarkup
   *   Title for the form.
   */
  public function getTitle() {
    return $this->t('Create referat');
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, ContentEntityInterface $bullet_point = NULL) {
    if (empty($bullet_point) || $bullet_point->getType() != 'decreto_bullet_point') {
      return $form;
    }

    $this->bulletPoint = $bullet_point;

    // Saving meeting for redirect purposes.
    $decretoBP = new DecretoBulletPoint($bullet_point);
    $meeting = $decretoBP->getMeeting();
    $this->parent = $meeting;

    $form['title'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Title'),
      '#placeholder' => $this->t('Title'),
      '#required' => TRUE,
      //TODO: add default value.
    ];

    $form = parent::appendFormCustomText($form);

    // If it is referat's edit page, populate values.
    $this->entity = $decretoBP->getReferat();
    if ($this->entity) {
      $form = $this->populateFormData($form, $form_state, $this->entity);
    }

    $form = parent::buildForm($form, $form_state);

    return $form;
  }

  /**
   * Populates referat form with data from real meeting.
   *
   * @param array $form
   *   Render array representing from.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   Current form state.
   * @param \Drupal\node\NodeInterface $referat
   *   Referat node.
   *
   * @return array
   *   Form array with populated values.
   */
  public function populateFormData(array $form, FormStateInterface $form_state, NodeInterface $referat) {
    $form['title']['#default_value'] = $referat->getTitle();
    $form['custom_text']['body']['#default_value'] = $referat->body->value;

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $title = $form_state->getValue('title');
    $body = $form_state->getValue('body');

    if (!$this->entity) {
      $this->entity = Node::create([
        'type' => 'decreto_bullet_point_attachment',
        'title' => $title,
        'status' => 1,
        'body' => $body,
      ]);
    }
    else {
      $this->entity->setTitle($title);
      $this->entity->set('body', $body);
    }

    $this->entity->save();

    $decretoBP = new DecretoBulletPoint($this->bulletPoint);
    $decretoBP->setReferat($this->entity->id());
  }

}
