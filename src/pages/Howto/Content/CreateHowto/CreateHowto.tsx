import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { Form, Field } from 'react-final-form'
import { FieldArray } from 'react-final-form-arrays'
import arrayMutators from 'final-form-arrays'
import { IHowto, IHowtoFormInput } from 'src/models/howto.models'
import { db } from 'src/utils/firebase'
import { TUTORIAL_TEMPLATE_DATA } from './TutorialTemplate'
import {
  IFirebaseUploadInfo,
  FirebaseFileUploader,
} from 'src/pages/common/FirebaseFileUploader/FirebaseFileUploader'
import helpers from 'src/utils/helpers'
import { TagsSelect } from 'src/pages/common/Tags'
import { UploadedFile } from 'src/pages/common/UploadedFile/UploadedFile'
import { FirebaseFileUploaderField } from 'src/pages/common/FirebaseFileUploader/FirebaseFileUploaderField'
import { InputField, Label, TextArea } from 'src/components/Form/Fields'
import { Step } from './Step/Step'
import {
  FormContainer,
  Title,
  TutorialForm,
  Background,
  DescriptionContainer,
  StepBackground,
  CoverImage,
  Select,
  AddStepButton,
  SubmitButton,
} from './elements'
import Link from 'react-router-dom/Link'
import { BackButtonTop } from '../elements'

export interface IState {
  formValues: IHowtoFormInput
  formSaved: boolean
  _docID: string
  _uploadPath: string
  _toDocsList: boolean
}

const required = (value: any) => (value ? undefined : 'Required')

export class CreateHowto extends React.PureComponent<
  RouteComponentProps<any>,
  IState
> {
  uploadRefs: { [key: string]: UploadedFile | null } = {}
  constructor(props: any) {
    super(props)
    // generate unique id for db and storage references and assign to state
    const databaseRef = db.collection('documentation').doc()
    const docID = databaseRef.id
    this.state = {
      formValues: { ...TUTORIAL_TEMPLATE_DATA, id: docID },
      formSaved: false,
      _docID: docID,
      _uploadPath: `uploads/documentation/${docID}`,
      _toDocsList: false,
    }
  }

  public onSubmit = async (formValues: IHowtoFormInput) => {
    if (!formValues.cover_image) {
      alert('Please provide a cover image before saving your tutorial')
    } else {
      const timestamp = new Date()
      const slug = helpers.stripSpecialCharacters(formValues.tutorial_title)
      // convert data to correct types and populate metadata
      const values: IHowto = {
        ...this.castFormValuesToCorrectTypes(formValues),
        slug,
        cover_image: formValues.cover_image as IFirebaseUploadInfo,
        _created: timestamp,
        _modified: timestamp,
      }
      try {
        await db
          .collection('documentation')
          .doc(formValues.id)
          .set(values)
        this.setState({ formSaved: true })
        this.props.history.push('/how-to/' + slug)
      } catch (error) {
        console.log('error while saving the tutorial')
      }
    }
  }

  public validate = async (formValues: IHowtoFormInput) => {
    // TODO: validate cover image exists
    // if (this.state.formValues.cover_image_url === '') {
    // alert('Please provide a cover image before saving your tutorial')
    return Promise.resolve({})
  }

  // By default all tutorial form input fields come as strings. We want to cast to the
  // correct data types if this ever becomes more complex could use
  // https://medium.freecodecamp.org/how-to-write-powerful-schemas-in-javascript-490da6233d37
  public castFormValuesToCorrectTypes(values: IHowtoFormInput) {
    const formattedValues = {
      ...values,
      tutorial_cost: Number(values.tutorial_cost),
    }
    return formattedValues
  }

  public render() {
    const { formValues } = this.state
    console.log('formvalues', formValues)
    return (
      <div>
        <Link to={'/how-to/list'}>
          <BackButtonTop icon={'arrow-back'}>Back to how-to</BackButtonTop>
        </Link>
        <Title variant="h4" component="h4" style={{ marginTop: 0 }}>
          Create a How-To
        </Title>
        <Form
          onSubmit={this.onSubmit}
          initialValues={formValues}
          validate={this.validate}
          mutators={{
            ...arrayMutators,
            clearCoverImage: (args, state, utils) => {
              utils.changeValue(state, 'cover_image', () => null)
            },
          }}
          render={({
            handleSubmit,
            mutators,
            submitting,
            values,
            form,
            invalid,
          }) => {
            const v = values as IHowto
            return (
              <FormContainer>
                <TutorialForm onSubmit={handleSubmit}>
                  <Background>
                    <DescriptionContainer>
                      <Field
                        name="workspace_name"
                        validate={required}
                        component={InputField}
                        label="What is your davehakkens.nl account ?"
                        placeholder="@janedoe"
                      />
                      <Field
                        name="tutorial_title"
                        validate={required}
                        component={InputField}
                        label="What is the title of your How-To ?"
                        placeholder="How to make XXX using YYY"
                      />
                      {v.cover_image && v.cover_image.downloadUrl ? (
                        <UploadedFile
                          file={v.cover_image}
                          imagePreview
                          showDelete
                          onFileDeleted={form.mutators.clearCoverImage}
                        />
                      ) : (
                        <Field
                          name="cover_image"
                          component={FirebaseFileUploaderField}
                          storagePath={this.state._uploadPath}
                          hidden={true}
                          accept="image/png, image/jpeg"
                          buttonText="Upload a cover image"
                        />
                      )}

                      <Label
                        text={'Write a short description for the How-To'}
                        style={{ margin: '50px 0 10px' }}
                      />
                      <Field
                        name="tutorial_description"
                        validate={required}
                        component={TextArea}
                        placeholder="This is what we will do"
                      />
                      <Label
                        text={'Add Tags'}
                        style={{ margin: '50px 0 10px' }}
                      />
                      <Field
                        name="tags"
                        component={TagsSelect}
                        onChange={tags => console.log('field changed', tags)}
                      />
                      <Field
                        name="tutorial_time"
                        validate={required}
                        component={InputField}
                        label="How much time does it take ? (hours/week)"
                        placeholder="2 hours"
                      />
                      <Field
                        name="tutorial_cost"
                        validate={required}
                        component={InputField}
                        label="How much does it cost roughly (€)?"
                        placeholder="10"
                      />
                      <Label
                        text={'How difficult to replicate is your How-To ?'}
                        style={{ margin: '50px 0 10px' }}
                      />
                      <Select name="difficulty_level" component="select">
                        <option value="easy">easy</option>
                        <option value="medium">medium</option>
                        <option value="difficult">difficult</option>
                      </Select>
                      <Label
                        text={'File to support your How-To ? (20mb max)'}
                        style={{ margin: '50px 0 10px' }}
                      />
                      <FirebaseFileUploader
                        hidden={true}
                        buttonText="Upload files"
                        storagePath={this.state._uploadPath}
                        onUploadSuccess={fileInfo => {
                          mutators.push('tutorial_files', fileInfo)
                        }}
                      />
                      {v.tutorial_files.map((file, index) => (
                        <UploadedFile
                          key={file.downloadUrl}
                          file={file}
                          showDelete
                          onFileDeleted={() => {
                            mutators.remove('tutorial_files', index)
                          }}
                          // ref={el =>
                          //   this.addUploadRef(el, `tutorial_files[${index}]`)
                          // }
                        />
                      ))}
                      <Field
                        name="tutorial_extern_file_url"
                        component={InputField}
                        label="Or a link"
                        placeholder="https://drive.google.com/drive/u/2/folders/..."
                      />
                    </DescriptionContainer>
                  </Background>
                  <StepBackground>
                    <FieldArray name="steps">
                      {({ fields }) => (
                        <div>
                          {fields.map((step, index: number) => (
                            <Step
                              step={step}
                              index={index}
                              key={index}
                              onDelete={(fieldIndex: number) => {
                                fields.remove(fieldIndex)
                              }}
                              values={values}
                              _uploadPath={this.state._uploadPath}
                            />
                          ))}
                          <AddStepButton
                            icon={'add'}
                            onClick={() => {
                              fields.push({
                                title: '',
                                text: '',
                                images: [],
                              })
                            }}
                          >
                            add step
                          </AddStepButton>
                        </div>
                      )}
                    </FieldArray>
                    <SubmitButton
                      type="submit"
                      icon={'check'}
                      disabled={submitting || invalid}
                    >
                      Save
                    </SubmitButton>
                  </StepBackground>
                </TutorialForm>
              </FormContainer>
            )
          }}
        />
      </div>
    )
  }
}

// componentWillUnmount() {
//   // remove any uploaded images if not saved
//   if (!this.state.formSaved) {
//     this.purgeUploads()
//   }
// }

// // when a file upload component is created can optionally add a named reference
// // to itself to enable calling methods (such as 'delete()') on it later from this component
// // this will automatically populate as null when the component is destroyed
// addUploadRef(ref: UploadedFile | null, key: string) {
//   this.uploadRefs[key] = ref
// }

// // remove any uploaded images or files (case when user decided not to save doc)
// // requires a name to be given to all UploadedFile components
// purgeUploads() {
//   Object.keys(this.uploadRefs).forEach(key => {
//     const ref = this.uploadRefs[key]
//     if (ref) {
//       ref.delete()
//     }
//   })
// }
